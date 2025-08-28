import { IntegrationManager } from '@/services/IntegrationManager';
import { ServiceProxy } from '@/services/ServiceProxy';
import { ToolHealthMonitor } from '@/services/ToolHealthMonitor';
import { CommunicationBridge } from '@/services/CommunicationBridge';
import { RetryLogic } from '@/services/RetryLogic';
import { ToolIntegration, ToolCapability } from '@/types/tool';

// Mock DOM environment for testing
Object.defineProperty(window, 'postMessage', {
  value: jest.fn(),
  writable: true
});

// Mock iframe creation
const mockIframe = {
  contentWindow: {
    postMessage: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  setAttribute: jest.fn(),
  style: {},
  parentNode: {
    removeChild: jest.fn()
  }
} as any;

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName: string) => {
    if (tagName === 'iframe') {
      return mockIframe;
    }
    return {};
  }),
  writable: true
});

describe('Tool Integration Framework', () => {
  let integrationManager: IntegrationManager;
  let serviceProxy: ServiceProxy;
  let healthMonitor: ToolHealthMonitor;
  let communicationBridge: CommunicationBridge;
  let mockContainer: HTMLElement;

  const mockTool: ToolIntegration = {
    id: 'test-tool',
    name: 'Test Tool',
    category: 'creative',
    url: 'https://example.com/tool',
    embedType: 'iframe',
    capabilities: [
      {
        name: 'edit_image',
        description: 'Edit images',
        parameters: [
          { name: 'image', type: 'file', required: true },
          { name: 'filters', type: 'array', required: false }
        ],
        async: false
      }
    ],
    inputFormats: ['image/png', 'image/jpeg'],
    outputFormats: ['image/png', 'image/jpeg'],
    configuration: {
      sandbox: true,
      allowedDomains: ['example.com']
    }
  };

  beforeEach(() => {
    integrationManager = new IntegrationManager({
      timeoutMs: 5000,
      retryAttempts: 2
    });

    serviceProxy = new ServiceProxy({
      rateLimitMs: 100,
      cacheEnabled: true
    });

    healthMonitor = new ToolHealthMonitor({
      healthCheckInterval: 1000,
      timeoutMs: 2000
    });

    communicationBridge = new CommunicationBridge({
      messageTimeout: 3000,
      maxRetries: 2
    });

    mockContainer = document.createElement('div');
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    integrationManager?.cleanup?.();
    healthMonitor?.destroy?.();
    communicationBridge?.destroy?.();
  });

  describe('IntegrationManager', () => {
    test('should load tool successfully', async () => {
      // Mock successful iframe load
      mockIframe.addEventListener.mockImplementation((event: string, callback: Function) => {
        if (event === 'load') {
          setTimeout(callback, 10);
        }
      });

      const instance = await integrationManager.loadTool(mockTool, mockContainer);

      expect(instance).toBeDefined();
      expect(instance.toolId).toBe(mockTool.id);
      expect(instance.status).toBe('ready');
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockIframe);
    });

    test('should handle tool loading timeout', async () => {
      // Mock timeout scenario
      mockIframe.addEventListener.mockImplementation(() => {
        // Don't call the callback to simulate timeout
      });

      await expect(
        integrationManager.loadTool(mockTool, mockContainer)
      ).rejects.toThrow('Tool loading timeout');
    });

    test('should unload tool and clean up resources', async () => {
      mockIframe.addEventListener.mockImplementation((event: string, callback: Function) => {
        if (event === 'load') {
          setTimeout(callback, 10);
        }
      });

      const instance = await integrationManager.loadTool(mockTool, mockContainer);
      await integrationManager.unloadTool(instance.id);

      expect(instance.status).toBe('destroyed');
      expect(mockContainer.removeChild).toHaveBeenCalledWith(mockIframe);
    });

    test('should execute tool capabilities', async () => {
      mockIframe.addEventListener.mockImplementation((event: string, callback: Function) => {
        if (event === 'load') {
          setTimeout(callback, 10);
        }
      });

      const instance = await integrationManager.loadTool(mockTool, mockContainer);
      const capability = mockTool.capabilities[0];

      // Mock communication bridge response
      jest.spyOn(communicationBridge, 'executeCapability').mockResolvedValue({
        success: true,
        result: 'edited_image_data'
      });

      const result = await integrationManager.executeCapability(
        instance.id,
        capability.name,
        { image: 'test_image_data' }
      );

      expect(result).toBeDefined();
    });

    test('should transfer data between tool instances', async () => {
      mockIframe.addEventListener.mockImplementation((event: string, callback: Function) => {
        if (event === 'load') {
          setTimeout(callback, 10);
        }
      });

      const sourceInstance = await integrationManager.loadTool(mockTool, mockContainer);
      const targetInstance = await integrationManager.loadTool(mockTool, mockContainer);

      jest.spyOn(serviceProxy, 'transformData').mockResolvedValue('transformed_data');
      jest.spyOn(communicationBridge, 'transferData').mockResolvedValue();

      await integrationManager.transferData(
        sourceInstance.id,
        targetInstance.id,
        'test_data'
      );

      expect(serviceProxy.transformData).toHaveBeenCalled();
      expect(communicationBridge.transferData).toHaveBeenCalled();
    });
  });

  describe('ServiceProxy', () => {
    test('should make successful API request', async () => {
      const mockResponse = { data: 'test_data', status: 200 };
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse.data)
      });

      const result = await serviceProxy.makeRequest({
        url: 'https://api.example.com/data',
        method: 'GET'
      });

      expect(result.status).toBe(200);
      expect(result.data).toBe('test_data');
    });

    test('should handle CORS proxy for external URLs', () => {
      const externalUrl = 'https://external-tool.com/api';
      const proxiedUrl = serviceProxy.getProxiedUrl(externalUrl);

      expect(proxiedUrl).toContain('allorigins.win');
      expect(proxiedUrl).toContain(encodeURIComponent(externalUrl));
    });

    test('should cache successful responses', async () => {
      const mockResponse = { data: 'cached_data' };
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse.data)
      });

      // First request
      const result1 = await serviceProxy.makeRequest({
        url: 'https://api.example.com/data',
        method: 'GET'
      });

      // Second request should use cache
      const result2 = await serviceProxy.makeRequest({
        url: 'https://api.example.com/data',
        method: 'GET'
      });

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result2.cached).toBe(true);
    });

    test('should transform data between different tool formats', async () => {
      const imageData = 'base64_image_data';
      const result = await serviceProxy.transformData(imageData, 'photopea', 'svg-edit');

      expect(result).toBeDefined();
      expect(result.converted).toBe(true);
    });

    test('should perform health checks on services', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      const isHealthy = await serviceProxy.healthCheck('https://healthy-service.com');
      expect(isHealthy).toBe(true);

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      const isUnhealthy = await serviceProxy.healthCheck('https://unhealthy-service.com');
      expect(isUnhealthy).toBe(false);
    });
  });

  describe('ToolHealthMonitor', () => {
    test('should perform health checks on tool instances', async () => {
      const mockInstance = {
        id: 'test-instance',
        toolId: 'test-tool',
        iframe: mockIframe,
        status: 'ready' as const,
        capabilities: [],
        lastHealthCheck: new Date()
      };

      healthMonitor.addInstance(mockInstance);

      // Mock successful ping response
      window.addEventListener = jest.fn().mockImplementation((event, callback) => {
        if (event === 'message') {
          setTimeout(() => {
            callback({
              data: {
                type: 'health_check_response',
                messageId: 'test_message_id'
              }
            });
          }, 100);
        }
      });

      const result = await healthMonitor.performHealthCheck(mockInstance.id);

      expect(result.status).toBe('healthy');
      expect(result.instanceId).toBe(mockInstance.id);
    });

    test('should trigger fallback when health checks fail', async () => {
      const mockInstance = {
        id: 'failing-instance',
        toolId: 'photopea',
        iframe: mockIframe,
        status: 'ready' as const,
        capabilities: [],
        lastHealthCheck: new Date()
      };

      healthMonitor.addInstance(mockInstance);

      let fallbackTriggered = false;
      healthMonitor.on('fallbackTriggered', () => {
        fallbackTriggered = true;
      });

      // Mock failed health check
      jest.spyOn(healthMonitor as any, 'pingInstance').mockRejectedValue(
        new Error('Health check failed')
      );

      // Perform multiple failed health checks to trigger fallback
      for (let i = 0; i < 3; i++) {
        await healthMonitor.performHealthCheck(mockInstance.id).catch(() => {});
      }

      expect(fallbackTriggered).toBe(true);
    });

    test('should provide fallback options for failed tools', async () => {
      const fallbackOptions = await healthMonitor.getFallbackOptions('photopea');

      expect(fallbackOptions).toHaveLength(2);
      expect(fallbackOptions[0].toolId).toBe('pixlr-editor');
      expect(fallbackOptions[0].priority).toBe(1);
    });

    test('should perform batch health checks', async () => {
      const instances = [
        {
          id: 'instance-1',
          toolId: 'tool-1',
          iframe: mockIframe,
          status: 'ready' as const,
          capabilities: [],
          lastHealthCheck: new Date()
        },
        {
          id: 'instance-2',
          toolId: 'tool-2',
          iframe: mockIframe,
          status: 'ready' as const,
          capabilities: [],
          lastHealthCheck: new Date()
        }
      ];

      instances.forEach(instance => healthMonitor.addInstance(instance));

      const results = await healthMonitor.performBatchHealthCheck();

      expect(results).toHaveLength(2);
      expect(results.every(result => result.instanceId)).toBe(true);
    });
  });

  describe('CommunicationBridge', () => {
    test('should establish communication with tool instance', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'initialize',
          payload: expect.objectContaining({
            toolConfig: mockTool.configuration,
            capabilities: mockTool.capabilities
          })
        }),
        '*'
      );
    });

    test('should handle message timeouts with retry logic', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      // Mock no response to trigger timeout and retry
      const pingPromise = communicationBridge.ping('test-instance');

      await expect(pingPromise).rejects.toThrow('Message timeout');
    });

    test('should execute tool capabilities through messaging', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      const capability: ToolCapability = {
        name: 'edit_image',
        description: 'Edit image',
        parameters: [],
        async: false
      };

      // Mock successful response
      setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: {
            type: 'execute_capability_response',
            messageId: expect.any(String),
            payload: { result: 'success' }
          }
        }));
      }, 100);

      const result = await communicationBridge.executeCapability(
        'test-instance',
        capability,
        { image: 'test_data' }
      );

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'execute_capability',
          payload: expect.objectContaining({
            capabilityName: 'edit_image',
            parameters: { image: 'test_data' }
          })
        }),
        '*'
      );
    });

    test('should handle data transfer between tools', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      await communicationBridge.transferData('test-instance', { data: 'transfer_data' });

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'data_transfer',
          payload: { data: { data: 'transfer_data' } }
        }),
        '*'
      );
    });

    test('should clean up instance communication', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);
      await communicationBridge.destroyInstance('test-instance');

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cleanup'
        }),
        '*'
      );
    });
  });

  describe('RetryLogic', () => {
    test('should retry failed operations with exponential backoff', async () => {
      const retryLogic = new RetryLogic({
        maxAttempts: 3,
        baseDelayMs: 100,
        backoffMultiplier: 2
      });

      let attemptCount = 0;
      const failingOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('NetworkError');
        }
        return 'success';
      });

      const result = await retryLogic.executeWithRetry(failingOperation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });

    test('should not retry non-retryable errors', async () => {
      const retryLogic = new RetryLogic({
        maxAttempts: 3,
        retryableErrors: ['NetworkError']
      });

      const failingOperation = jest.fn().mockImplementation(() => {
        throw new Error('ValidationError');
      });

      const result = await retryLogic.executeWithRetry(failingOperation);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(failingOperation).toHaveBeenCalledTimes(1);
    });

    test('should implement circuit breaker pattern', async () => {
      const retryLogic = new RetryLogic();
      
      const failingOperation = jest.fn().mockImplementation(() => {
        throw new Error('ServiceUnavailable');
      });

      // Trigger circuit breaker by exceeding failure threshold
      for (let i = 0; i < 6; i++) {
        try {
          await retryLogic.executeWithCircuitBreaker(failingOperation, {
            failureThreshold: 5,
            resetTimeoutMs: 1000
          });
        } catch (error) {
          // Expected failures
        }
      }

      // Circuit should be open now
      await expect(
        retryLogic.executeWithCircuitBreaker(failingOperation)
      ).rejects.toThrow('Circuit breaker is OPEN');
    });
  });

  describe('End-to-End Integration', () => {
    test('should complete full tool integration workflow', async () => {
      // Setup integration manager with all components
      const manager = new IntegrationManager({
        timeoutMs: 10000,
        retryAttempts: 2
      });

      // Mock successful tool loading
      mockIframe.addEventListener.mockImplementation((event: string, callback: Function) => {
        if (event === 'load') {
          setTimeout(callback, 10);
        }
      });

      // Load tool
      const instance = await manager.loadTool(mockTool, mockContainer);
      expect(instance.status).toBe('ready');

      // Execute capability
      jest.spyOn(manager as any, 'communicationBridge').mockImplementation({
        executeCapability: jest.fn().mockResolvedValue({ result: 'processed_data' })
      });

      const result = await manager.executeCapability(
        instance.id,
        'edit_image',
        { image: 'test_image' }
      );

      expect(result).toBeDefined();

      // Clean up
      await manager.unloadTool(instance.id);
      expect(instance.status).toBe('destroyed');
    });

    test('should handle tool failure and fallback scenario', async () => {
      const manager = new IntegrationManager();
      const monitor = new ToolHealthMonitor({
        healthCheckInterval: 500,
        maxConsecutiveFailures: 2
      });

      // Mock tool instance
      const instance = {
        id: 'failing-tool',
        toolId: 'photopea',
        iframe: mockIframe,
        status: 'ready' as const,
        capabilities: [],
        lastHealthCheck: new Date()
      };

      monitor.addInstance(instance);

      let fallbackTriggered = false;
      monitor.on('fallbackTriggered', (data: any) => {
        fallbackTriggered = true;
        expect(data.fallbackToolId).toBe('pixlr-editor');
      });

      // Simulate health check failures
      jest.spyOn(monitor as any, 'pingInstance').mockRejectedValue(
        new Error('Tool not responding')
      );

      // Trigger multiple failed health checks
      for (let i = 0; i < 3; i++) {
        await monitor.performHealthCheck(instance.id).catch(() => {});
      }

      expect(fallbackTriggered).toBe(true);
    });
  });
});