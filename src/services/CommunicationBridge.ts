import { ToolIntegration, ToolCapability } from '@/types/tool';

export interface MessageProtocol {
  type: string;
  messageId: string;
  instanceId: string;
  payload?: any;
  timestamp: number;
}

export interface PendingMessage {
  messageId: string;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  retryCount: number;
}

export interface CommunicationConfig {
  messageTimeout: number;
  maxRetries: number;
  retryDelayMs: number;
  allowedOrigins: string[];
}

export class CommunicationBridge {
  private instances = new Map<string, { iframe: HTMLIFrameElement; tool: ToolIntegration }>();
  private pendingMessages = new Map<string, PendingMessage>();
  private messageHandlers = new Map<string, Function>();
  private config: CommunicationConfig;
  private listeners = new Map<string, Function[]>();

  constructor(config: Partial<CommunicationConfig> = {}) {
    this.config = {
      messageTimeout: 30000,
      maxRetries: 3,
      retryDelayMs: 1000,
      allowedOrigins: ['*'],
      ...config
    };

    this.setupGlobalMessageListener();
    this.registerDefaultHandlers();
  }

  async setupInstance(
    instanceId: string, 
    iframe: HTMLIFrameElement, 
    tool: ToolIntegration
  ): Promise<void> {
    this.instances.set(instanceId, { iframe, tool });

    // Wait for iframe to load and establish communication
    await this.waitForInstanceReady(instanceId);
    
    // Send initialization message
    await this.sendMessage(instanceId, {
      type: 'initialize',
      payload: {
        toolConfig: tool.configuration,
        capabilities: tool.capabilities,
        instanceId
      }
    });
  }

  async destroyInstance(instanceId: string): Promise<void> {
    // Send cleanup message
    try {
      await this.sendMessage(instanceId, {
        type: 'cleanup',
        payload: { instanceId }
      }, { timeout: 5000 });
    } catch (error) {
      console.warn(`Failed to send cleanup message to ${instanceId}:`, error);
    }

    // Clean up pending messages for this instance
    for (const [messageId, pending] of this.pendingMessages) {
      if (messageId.startsWith(instanceId)) {
        clearTimeout(pending.timeout);
        pending.reject(new Error('Instance destroyed'));
        this.pendingMessages.delete(messageId);
      }
    }

    this.instances.delete(instanceId);
  }

  async executeCapability(
    instanceId: string, 
    capability: ToolCapability, 
    parameters: Record<string, any>
  ): Promise<any> {
    const message = {
      type: 'execute_capability',
      payload: {
        capabilityName: capability.name,
        parameters,
        async: capability.async
      }
    };

    if (capability.async) {
      // For async operations, return a promise that resolves when operation completes
      return this.sendMessage(instanceId, message, { 
        timeout: this.config.messageTimeout * 2 
      });
    } else {
      return this.sendMessage(instanceId, message);
    }
  }

  async transferData(instanceId: string, data: any): Promise<void> {
    await this.sendMessage(instanceId, {
      type: 'data_transfer',
      payload: { data }
    });
  }

  async sendInitialData(instanceId: string, data: any): Promise<void> {
    await this.sendMessage(instanceId, {
      type: 'initial_data',
      payload: { data }
    });
  }

  async ping(instanceId: string): Promise<number> {
    const startTime = Date.now();
    
    await this.sendMessage(instanceId, {
      type: 'ping',
      payload: { timestamp: startTime }
    }, { timeout: 5000 });

    return Date.now() - startTime;
  }

  private async sendMessage(
    instanceId: string, 
    message: Omit<MessageProtocol, 'messageId' | 'instanceId' | 'timestamp'>,
    options: { timeout?: number; retries?: number } = {}
  ): Promise<any> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const messageId = this.generateMessageId(instanceId);
    const fullMessage: MessageProtocol = {
      ...message,
      messageId,
      instanceId,
      timestamp: Date.now()
    };

    const timeout = options.timeout || this.config.messageTimeout;
    const maxRetries = options.retries || this.config.maxRetries;

    return this.sendMessageWithRetry(instance.iframe, fullMessage, timeout, maxRetries);
  }

  private async sendMessageWithRetry(
    iframe: HTMLIFrameElement,
    message: MessageProtocol,
    timeout: number,
    maxRetries: number,
    currentRetry: number = 0
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(message.messageId);
        
        if (currentRetry < maxRetries) {
          // Retry with exponential backoff
          const delay = this.config.retryDelayMs * Math.pow(2, currentRetry);
          setTimeout(() => {
            this.sendMessageWithRetry(iframe, message, timeout, maxRetries, currentRetry + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          reject(new Error(`Message timeout after ${maxRetries} retries: ${message.type}`));
        }
      }, timeout);

      this.pendingMessages.set(message.messageId, {
        messageId: message.messageId,
        resolve,
        reject,
        timeout: timeoutId,
        retryCount: currentRetry
      });

      try {
        iframe.contentWindow?.postMessage(message, '*');
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingMessages.delete(message.messageId);
        reject(new Error(`Failed to send message: ${error.message}`));
      }
    });
  }

  private async waitForInstanceReady(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Instance ${instanceId} ready timeout`));
      }, 30000);

      const checkReady = () => {
        try {
          // Try to access iframe content window
          if (instance.iframe.contentWindow) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        } catch (error) {
          setTimeout(checkReady, 100);
        }
      };

      // Start checking after iframe load
      if (instance.iframe.contentDocument?.readyState === 'complete') {
        checkReady();
      } else {
        instance.iframe.addEventListener('load', checkReady);
      }
    });
  }

  private setupGlobalMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      this.handleIncomingMessage(event);
    });
  }

  private handleIncomingMessage(event: MessageEvent): void {
    // Validate origin if configured
    if (this.config.allowedOrigins.length > 0 && 
        !this.config.allowedOrigins.includes('*') &&
        !this.config.allowedOrigins.includes(event.origin)) {
      console.warn(`Message from unauthorized origin: ${event.origin}`);
      return;
    }

    const message = event.data as MessageProtocol;
    if (!message || typeof message !== 'object' || !message.type) {
      return; // Not our message format
    }

    // Handle response messages
    if (message.type.endsWith('_response') || message.type === 'pong') {
      this.handleResponseMessage(message);
      return;
    }

    // Handle event messages from tools
    this.handleEventMessage(message, event);
  }

  private handleResponseMessage(message: MessageProtocol): void {
    const pending = this.pendingMessages.get(message.messageId);
    if (!pending) {
      return; // No pending request for this message
    }

    clearTimeout(pending.timeout);
    this.pendingMessages.delete(message.messageId);

    if (message.type.includes('error') || message.payload?.error) {
      pending.reject(new Error(message.payload?.error || 'Unknown error'));
    } else {
      pending.resolve(message.payload);
    }
  }

  private handleEventMessage(message: MessageProtocol, event: MessageEvent): void {
    // Handle different types of events from tools
    switch (message.type) {
      case 'tool_ready':
        this.emit('toolReady', { instanceId: message.instanceId });
        break;
      
      case 'tool_error':
        this.emit('toolError', { 
          instanceId: message.instanceId, 
          error: message.payload?.error 
        });
        break;
      
      case 'data_changed':
        this.emit('dataChanged', {
          instanceId: message.instanceId,
          data: message.payload?.data
        });
        break;
      
      case 'capability_completed':
        this.emit('capabilityCompleted', {
          instanceId: message.instanceId,
          capability: message.payload?.capability,
          result: message.payload?.result
        });
        break;
      
      case 'progress_update':
        this.emit('progressUpdate', {
          instanceId: message.instanceId,
          progress: message.payload?.progress
        });
        break;

      case 'health_check':
        // Respond to health check
        this.sendHealthCheckResponse(message, event.source as Window);
        break;

      default:
        // Check for custom message handlers
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message, event);
        }
    }
  }

  private sendHealthCheckResponse(message: MessageProtocol, source: Window): void {
    try {
      source.postMessage({
        type: 'health_check_response',
        messageId: message.messageId,
        instanceId: message.instanceId,
        timestamp: Date.now()
      }, '*');
    } catch (error) {
      console.error('Failed to send health check response:', error);
    }
  }

  private registerDefaultHandlers(): void {
    // Register handlers for common message types
    this.messageHandlers.set('file_upload_request', (message: MessageProtocol) => {
      this.emit('fileUploadRequest', {
        instanceId: message.instanceId,
        fileTypes: message.payload?.fileTypes
      });
    });

    this.messageHandlers.set('external_link_request', (message: MessageProtocol) => {
      this.emit('externalLinkRequest', {
        instanceId: message.instanceId,
        url: message.payload?.url
      });
    });

    this.messageHandlers.set('download_request', (message: MessageProtocol) => {
      this.emit('downloadRequest', {
        instanceId: message.instanceId,
        data: message.payload?.data,
        filename: message.payload?.filename
      });
    });
  }

  registerMessageHandler(messageType: string, handler: Function): void {
    this.messageHandlers.set(messageType, handler);
  }

  unregisterMessageHandler(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  private generateMessageId(instanceId: string): string {
    return `${instanceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event emitter functionality
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
        this.emit('communicationError', { event, error });
      }
    });
  }

  // Cleanup
  destroy(): void {
    // Clear all pending messages
    for (const [messageId, pending] of this.pendingMessages) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Communication bridge destroyed'));
    }
    
    this.pendingMessages.clear();
    this.instances.clear();
    this.messageHandlers.clear();
    this.listeners.clear();
  }
}