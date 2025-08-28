import { CommunicationBridge } from '@/services/CommunicationBridge';
import { ToolIntegration } from '@/types/tool';

describe('Communication Protocols Integration', () => {
  let communicationBridge: CommunicationBridge;
  let mockIframe: any;
  let mockTool: ToolIntegration;

  beforeEach(() => {
    communicationBridge = new CommunicationBridge({
      messageTimeout: 5000,
      maxRetries: 3,
      allowedOrigins: ['*']
    });

    mockIframe = {
      contentWindow: {
        postMessage: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    mockTool = {
      id: 'test-communication-tool',
      name: 'Test Communication Tool',
      category: 'creative',
      url: 'https://example.com/tool',
      embedType: 'iframe',
      capabilities: [
        {
          name: 'process_data',
          description: 'Process data',
          parameters: [
            { name: 'data', type: 'object', required: true }
          ],
          async: true
        }
      ],
      inputFormats: ['application/json'],
      outputFormats: ['application/json'],
      configuration: {}
    };

    // Mock window.addEventListener for global message handling
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  afterEach(() => {
    communicationBridge.destroy();
    jest.clearAllMocks();
  });

  describe('Message Protocol Validation', () => {
    test('should validate message format and structure', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      const validMessage = {
        type: 'test_message',
        messageId: 'msg_123',
        instanceId: 'test-instance',
        timestamp: Date.now(),
        payload: { data: 'test' }
      };

      // Simulate receiving a valid message
      const messageEvent = new MessageEvent('message', {
        data: validMessage,
        origin: 'https://example.com'
      });

      // Should not throw error for valid message
      expect(() => {
        (communicationBridge as any).handleIncomingMessage(messageEvent);
      }).not.toThrow();
    });

    test('should reject malformed messages', () => {
      const invalidMessages = [
        null,
        undefined,
        'string_message',
        { type: null },
        { messageId: 'test' }, // missing type
        { type: 'test' } // missing messageId
      ];

      invalidMessages.forEach(invalidMessage => {
        const messageEvent = new MessageEvent('message', {
          data: invalidMessage,
          origin: 'https://example.com'
        });

        // Should handle gracefully without throwing
        expect(() => {
          (communicationBridge as any).handleIncomingMessage(messageEvent);
        }).not.toThrow();
      });
    });

    test('should enforce origin validation when configured', () => {
      const restrictedBridge = new CommunicationBridge({
        allowedOrigins: ['https://trusted-domain.com']
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const messageFromUntrustedOrigin = new MessageEvent('message', {
        data: { type: 'test', messageId: 'test' },
        origin: 'https://malicious-domain.com'
      });

      (restrictedBridge as any).handleIncomingMessage(messageFromUntrustedOrigin);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('unauthorized origin')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Bidirectional Communication', () => {
    test('should handle request-response communication pattern', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      // Mock response handling
      const responsePromise = communicationBridge.ping('test-instance');

      // Simulate response from tool
      setTimeout(() => {
        const responseMessage = {
          type: 'pong',
          messageId: expect.any(String),
          instanceId: 'test-instance',
          timestamp: Date.now(),
          payload: { timestamp: Date.now() }
        };

        const messageEvent = new MessageEvent('message', {
          data: responseMessage,
          origin: 'https://example.com'
        });

        (communicationBridge as any).handleIncomingMessage(messageEvent);
      }, 100);

      const responseTime = await responsePromise;
      expect(typeof responseTime).toBe('number');
      expect(responseTime).toBeGreaterThan(0);
    });

    test('should handle asynchronous capability execution', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      const capability = mockTool.capabilities[0];
      const executionPromise = communicationBridge.executeCapability(
        'test-instance',
        capability,
        { data: 'test_data' }
      );

      // Simulate async capability completion
      setTimeout(() => {
        const completionMessage = {
          type: 'execute_capability_response',
          messageId: expect.any(String),
          instanceId: 'test-instance',
          timestamp: Date.now(),
          payload: { result: 'processed_data', success: true }
        };

        const messageEvent = new MessageEvent('message', {
          data: completionMessage,
          origin: 'https://example.com'
        });

        (communicationBridge as any).handleIncomingMessage(messageEvent);
      }, 200);

      const result = await executionPromise;
      expect(result.result).toBe('processed_data');
      expect(result.success).toBe(true);
    });

    test('should handle tool-initiated events', (done) => {
      communicationBridge.on('dataChanged', (eventData: any) => {
        expect(eventData.instanceId).toBe('test-instance');
        expect(eventData.data).toBe('updated_data');
        done();
      });

      // Simulate tool sending data change event
      const dataChangeMessage = {
        type: 'data_changed',
        messageId: 'event_123',
        instanceId: 'test-instance',
        timestamp: Date.now(),
        payload: { data: 'updated_data' }
      };

      const messageEvent = new MessageEvent('message', {
        data: dataChangeMessage,
        origin: 'https://example.com'
      });

      (communicationBridge as any).handleIncomingMessage(messageEvent);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle communication timeouts', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      // Don't simulate any response to trigger timeout
      const timeoutPromise = communicationBridge.ping('test-instance');

      await expect(timeoutPromise).rejects.toThrow('Message timeout');
    });

    test('should retry failed communications', async () => {
      const retryBridge = new CommunicationBridge({
        messageTimeout: 1000,
        maxRetries: 2,
        retryDelayMs: 100
      });

      await retryBridge.setupInstance('test-instance', mockIframe, mockTool);

      let attemptCount = 0;
      mockIframe.contentWindow.postMessage.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Communication failed');
        }
      });

      // Should eventually succeed after retries
      const pingPromise = retryBridge.ping('test-instance');

      // Simulate successful response on third attempt
      setTimeout(() => {
        const responseMessage = {
          type: 'pong',
          messageId: expect.any(String),
          instanceId: 'test-instance',
          timestamp: Date.now()
        };

        const messageEvent = new MessageEvent('message', {
          data: responseMessage,
          origin: 'https://example.com'
        });

        (retryBridge as any).handleIncomingMessage(messageEvent);
      }, 300);

      await expect(pingPromise).resolves.toBeDefined();
      expect(attemptCount).toBe(3);
    });

    test('should handle tool error responses', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      const capability = mockTool.capabilities[0];
      const executionPromise = communicationBridge.executeCapability(
        'test-instance',
        capability,
        { data: 'invalid_data' }
      );

      // Simulate error response from tool
      setTimeout(() => {
        const errorMessage = {
          type: 'execute_capability_response',
          messageId: expect.any(String),
          instanceId: 'test-instance',
          timestamp: Date.now(),
          payload: { error: 'Invalid data format' }
        };

        const messageEvent = new MessageEvent('message', {
          data: errorMessage,
          origin: 'https://example.com'
        });

        (communicationBridge as any).handleIncomingMessage(messageEvent);
      }, 100);

      await expect(executionPromise).rejects.toThrow('Invalid data format');
    });

    test('should emit communication errors for monitoring', (done) => {
      communicationBridge.on('communicationError', (errorData: any) => {
        expect(errorData.event).toBeDefined();
        expect(errorData.error).toBeInstanceOf(Error);
        done();
      });

      // Simulate error in event listener
      communicationBridge.on('testEvent', () => {
        throw new Error('Event handler error');
      });

      (communicationBridge as any).emit('testEvent', {});
    });
  });

  describe('Security and Sandboxing', () => {
    test('should sanitize message payloads', () => {
      const maliciousPayload = {
        data: '<script>alert("xss")</script>',
        __proto__: { malicious: true },
        constructor: { prototype: { hack: true } }
      };

      const messageEvent = new MessageEvent('message', {
        data: {
          type: 'data_transfer',
          messageId: 'test_123',
          instanceId: 'test-instance',
          timestamp: Date.now(),
          payload: maliciousPayload
        },
        origin: 'https://example.com'
      });

      // Should handle malicious payload safely
      expect(() => {
        (communicationBridge as any).handleIncomingMessage(messageEvent);
      }).not.toThrow();
    });

    test('should validate message size limits', () => {
      const largePaylod = {
        data: 'x'.repeat(10 * 1024 * 1024) // 10MB string
      };

      const messageEvent = new MessageEvent('message', {
        data: {
          type: 'data_transfer',
          messageId: 'large_message',
          instanceId: 'test-instance',
          timestamp: Date.now(),
          payload: largePaylod
        },
        origin: 'https://example.com'
      });

      // Should handle large messages gracefully
      expect(() => {
        (communicationBridge as any).handleIncomingMessage(messageEvent);
      }).not.toThrow();
    });

    test('should prevent message injection attacks', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      // Attempt to inject malicious message
      const injectedMessage = {
        type: 'execute_capability_response',
        messageId: 'injected_123',
        instanceId: 'test-instance',
        timestamp: Date.now(),
        payload: { result: 'injected_result' }
      };

      const messageEvent = new MessageEvent('message', {
        data: injectedMessage,
        origin: 'https://malicious-domain.com'
      });

      // Should not process injected message
      (communicationBridge as any).handleIncomingMessage(messageEvent);

      // Verify no pending message was resolved
      const pendingMessages = (communicationBridge as any).pendingMessages;
      expect(pendingMessages.has('injected_123')).toBe(false);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent communications', async () => {
      const instances = ['instance-1', 'instance-2', 'instance-3'];
      
      // Setup multiple instances
      for (const instanceId of instances) {
        await communicationBridge.setupInstance(instanceId, mockIframe, mockTool);
      }

      // Send concurrent pings
      const pingPromises = instances.map(instanceId => 
        communicationBridge.ping(instanceId)
      );

      // Simulate responses for all instances
      setTimeout(() => {
        instances.forEach(instanceId => {
          const responseMessage = {
            type: 'pong',
            messageId: expect.any(String),
            instanceId,
            timestamp: Date.now()
          };

          const messageEvent = new MessageEvent('message', {
            data: responseMessage,
            origin: 'https://example.com'
          });

          (communicationBridge as any).handleIncomingMessage(messageEvent);
        });
      }, 100);

      const results = await Promise.all(pingPromises);
      expect(results).toHaveLength(3);
      expect(results.every(result => typeof result === 'number')).toBe(true);
    });

    test('should clean up resources on instance destruction', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      // Create pending message
      const pingPromise = communicationBridge.ping('test-instance');

      // Destroy instance
      await communicationBridge.destroyInstance('test-instance');

      // Pending message should be rejected
      await expect(pingPromise).rejects.toThrow('Instance destroyed');

      // Verify cleanup
      const instances = (communicationBridge as any).instances;
      expect(instances.has('test-instance')).toBe(false);
    });

    test('should handle high-frequency message exchanges', async () => {
      await communicationBridge.setupInstance('test-instance', mockIframe, mockTool);

      const messageCount = 100;
      const messages: Promise<any>[] = [];

      // Send many messages rapidly
      for (let i = 0; i < messageCount; i++) {
        messages.push(communicationBridge.ping('test-instance'));
      }

      // Simulate responses
      setTimeout(() => {
        for (let i = 0; i < messageCount; i++) {
          const responseMessage = {
            type: 'pong',
            messageId: expect.any(String),
            instanceId: 'test-instance',
            timestamp: Date.now()
          };

          const messageEvent = new MessageEvent('message', {
            data: responseMessage,
            origin: 'https://example.com'
          });

          (communicationBridge as any).handleIncomingMessage(messageEvent);
        }
      }, 100);

      const results = await Promise.all(messages);
      expect(results).toHaveLength(messageCount);
    });
  });

  describe('Custom Message Handlers', () => {
    test('should register and execute custom message handlers', (done) => {
      const customHandler = jest.fn((message: any, event: MessageEvent) => {
        expect(message.type).toBe('custom_event');
        expect(message.payload.customData).toBe('test_data');
        done();
      });

      communicationBridge.registerMessageHandler('custom_event', customHandler);

      const customMessage = {
        type: 'custom_event',
        messageId: 'custom_123',
        instanceId: 'test-instance',
        timestamp: Date.now(),
        payload: { customData: 'test_data' }
      };

      const messageEvent = new MessageEvent('message', {
        data: customMessage,
        origin: 'https://example.com'
      });

      (communicationBridge as any).handleIncomingMessage(messageEvent);
    });

    test('should unregister custom message handlers', () => {
      const customHandler = jest.fn();
      
      communicationBridge.registerMessageHandler('test_event', customHandler);
      communicationBridge.unregisterMessageHandler('test_event');

      const customMessage = {
        type: 'test_event',
        messageId: 'test_123',
        instanceId: 'test-instance',
        timestamp: Date.now(),
        payload: {}
      };

      const messageEvent = new MessageEvent('message', {
        data: customMessage,
        origin: 'https://example.com'
      });

      (communicationBridge as any).handleIncomingMessage(messageEvent);

      expect(customHandler).not.toHaveBeenCalled();
    });
  });
});