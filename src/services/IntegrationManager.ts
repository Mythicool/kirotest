import { ToolIntegration, ToolCapability } from '@/types/tool';
import { ServiceProxy } from './ServiceProxy';
import { ToolHealthMonitor } from './ToolHealthMonitor';
import { CommunicationBridge } from './CommunicationBridge';

export interface IntegrationConfig {
  sandboxPermissions: string[];
  allowedOrigins: string[];
  timeoutMs: number;
  retryAttempts: number;
  healthCheckInterval: number;
}

export interface ToolInstance {
  id: string;
  toolId: string;
  iframe: HTMLIFrameElement;
  status: 'loading' | 'ready' | 'error' | 'destroyed';
  capabilities: ToolCapability[];
  lastHealthCheck: Date;
}

export class IntegrationManager {
  private instances = new Map<string, ToolInstance>();
  private serviceProxy: ServiceProxy;
  private healthMonitor: ToolHealthMonitor;
  private communicationBridge: CommunicationBridge;
  private config: IntegrationConfig;

  constructor(config: Partial<IntegrationConfig> = {}) {
    this.config = {
      sandboxPermissions: [
        'allow-scripts',
        'allow-same-origin',
        'allow-forms',
        'allow-downloads'
      ],
      allowedOrigins: ['*'], // Will be restricted per tool
      timeoutMs: 30000,
      retryAttempts: 3,
      healthCheckInterval: 60000,
      ...config
    };

    this.serviceProxy = new ServiceProxy();
    this.healthMonitor = new ToolHealthMonitor(this.config.healthCheckInterval);
    this.communicationBridge = new CommunicationBridge(this.config.allowedOrigins);

    this.setupEventListeners();
  }

  async loadTool(
    tool: ToolIntegration, 
    container: HTMLElement,
    data?: any
  ): Promise<ToolInstance> {
    const instanceId = this.generateInstanceId();
    
    try {
      const iframe = this.createSecureIframe(tool, instanceId);
      container.appendChild(iframe);

      const instance: ToolInstance = {
        id: instanceId,
        toolId: tool.id,
        iframe,
        status: 'loading',
        capabilities: tool.capabilities,
        lastHealthCheck: new Date()
      };

      this.instances.set(instanceId, instance);

      // Set up communication bridge for this instance
      await this.communicationBridge.setupInstance(instanceId, iframe, tool);

      // Load the tool with optional data
      await this.loadToolContent(instance, tool, data);

      // Start health monitoring
      this.healthMonitor.addInstance(instance);

      instance.status = 'ready';
      return instance;

    } catch (error) {
      console.error(`Failed to load tool ${tool.id}:`, error);
      throw new Error(`Tool integration failed: ${error.message}`);
    }
  }

  async unloadTool(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    try {
      // Clean up communication bridge
      await this.communicationBridge.destroyInstance(instanceId);

      // Stop health monitoring
      this.healthMonitor.removeInstance(instanceId);

      // Remove iframe
      if (instance.iframe.parentNode) {
        instance.iframe.parentNode.removeChild(instance.iframe);
      }

      instance.status = 'destroyed';
      this.instances.delete(instanceId);

    } catch (error) {
      console.error(`Failed to unload tool instance ${instanceId}:`, error);
    }
  }

  async executeCapability(
    instanceId: string, 
    capabilityName: string, 
    parameters: Record<string, any>
  ): Promise<any> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'ready') {
      throw new Error(`Tool instance ${instanceId} not ready`);
    }

    const capability = instance.capabilities.find(c => c.name === capabilityName);
    if (!capability) {
      throw new Error(`Capability ${capabilityName} not found`);
    }

    return this.communicationBridge.executeCapability(instanceId, capability, parameters);
  }

  async transferData(
    sourceInstanceId: string, 
    targetInstanceId: string, 
    data: any
  ): Promise<void> {
    const sourceInstance = this.instances.get(sourceInstanceId);
    const targetInstance = this.instances.get(targetInstanceId);

    if (!sourceInstance || !targetInstance) {
      throw new Error('Invalid instance IDs for data transfer');
    }

    // Use service proxy for data transformation if needed
    const transformedData = await this.serviceProxy.transformData(
      data,
      sourceInstance.toolId,
      targetInstance.toolId
    );

    await this.communicationBridge.transferData(targetInstanceId, transformedData);
  }

  getInstanceStatus(instanceId: string): string | null {
    const instance = this.instances.get(instanceId);
    return instance ? instance.status : null;
  }

  getAllInstances(): ToolInstance[] {
    return Array.from(this.instances.values());
  }

  private createSecureIframe(tool: ToolIntegration, instanceId: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    
    // Security settings
    iframe.sandbox = this.config.sandboxPermissions.join(' ');
    iframe.setAttribute('data-instance-id', instanceId);
    iframe.setAttribute('data-tool-id', tool.id);
    
    // Styling
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = '#ffffff';
    
    // CSP and security headers
    iframe.setAttribute('csp', "default-src 'self'; script-src 'self' 'unsafe-inline'");
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    
    return iframe;
  }

  private async loadToolContent(
    instance: ToolInstance, 
    tool: ToolIntegration, 
    data?: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Tool loading timeout: ${tool.id}`));
      }, this.config.timeoutMs);

      const handleLoad = () => {
        clearTimeout(timeout);
        instance.iframe.removeEventListener('load', handleLoad);
        instance.iframe.removeEventListener('error', handleError);
        
        // Initialize tool with data if provided
        if (data) {
          this.communicationBridge.sendInitialData(instance.id, data);
        }
        
        resolve();
      };

      const handleError = () => {
        clearTimeout(timeout);
        instance.iframe.removeEventListener('load', handleLoad);
        instance.iframe.removeEventListener('error', handleError);
        reject(new Error(`Failed to load tool: ${tool.id}`));
      };

      instance.iframe.addEventListener('load', handleLoad);
      instance.iframe.addEventListener('error', handleError);

      // Load the tool URL through service proxy if needed
      const toolUrl = this.serviceProxy.getProxiedUrl(tool.url);
      instance.iframe.src = toolUrl;
    });
  }

  private setupEventListeners(): void {
    // Listen for health check failures
    this.healthMonitor.on('healthCheckFailed', (instanceId: string) => {
      this.handleHealthCheckFailure(instanceId);
    });

    // Listen for communication errors
    this.communicationBridge.on('communicationError', (instanceId: string, error: Error) => {
      this.handleCommunicationError(instanceId, error);
    });

    // Listen for window unload to clean up
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  private async handleHealthCheckFailure(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    console.warn(`Health check failed for instance ${instanceId}, attempting recovery`);
    
    try {
      // Try to recover the instance
      await this.communicationBridge.ping(instanceId);
      console.log(`Instance ${instanceId} recovered`);
    } catch (error) {
      console.error(`Failed to recover instance ${instanceId}:`, error);
      instance.status = 'error';
      
      // Emit event for UI to handle
      this.emit('instanceError', { instanceId, error });
    }
  }

  private handleCommunicationError(instanceId: string, error: Error): void {
    console.error(`Communication error for instance ${instanceId}:`, error);
    
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.status = 'error';
      this.emit('instanceError', { instanceId, error });
    }
  }

  private generateInstanceId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanup(): void {
    // Clean up all instances
    for (const instanceId of this.instances.keys()) {
      this.unloadTool(instanceId);
    }
  }

  // Simple event emitter functionality
  private listeners = new Map<string, Function[]>();

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => listener(data));
  }

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
}