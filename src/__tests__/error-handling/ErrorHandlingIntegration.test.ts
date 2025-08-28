import { ServiceErrorHandler, ServiceError } from '@/services/ServiceErrorHandler';
import { DataIntegrityManager } from '@/services/DataIntegrityManager';
import { NotificationSystem } from '@/services/NotificationSystem';
import { OfflineCapabilities } from '@/services/OfflineCapabilities';
import { AutomaticRecovery } from '@/services/AutomaticRecovery';
import { ProgressiveEnhancement } from '@/services/ProgressiveEnhancement';
import { Workspace } from '@/types/workspace';

// Mock all browser APIs
const setupMocks = () => {
  // IndexedDB mock
  const mockIDBRequest = {
    onsuccess: null as any,
    onerror: null as any,
    onupgradeneeded: null as any,
    result: {
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          put: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          get: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          getAll: jest.fn().mockReturnValue({ onsuccess: null, onerror: null, result: [] }),
          delete: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          clear: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          createIndex: jest.fn()
        })
      }),
      createObjectStore: jest.fn(),
      objectStoreNames: { contains: jest.fn().mockReturnValue(false) },
      close: jest.fn()
    }
  };

  Object.defineProperty(window, 'indexedDB', {
    value: { open: jest.fn().mockReturnValue(mockIDBRequest) }
  });

  // Navigator mocks
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { register: jest.fn().mockResolvedValue({}) }
  });

  // DOM mocks
  const mockElement = {
    id: '', className: '', innerHTML: '', style: { cssText: '', transform: '', opacity: '' },
    setAttribute: jest.fn(), appendChild: jest.fn(), remove: jest.fn(),
    addEventListener: jest.fn(), querySelector: jest.fn()
  };

  Object.defineProperty(document, 'getElementById', {
    value: jest.fn().mockReturnValue(mockElement)
  });
  Object.defineProperty(document, 'createElement', {
    value: jest.fn().mockReturnValue(mockElement)
  });
  Object.defineProperty(document, 'body', {
    value: { appendChild: jest.fn() }
  });

  // Notification API mock
  Object.defineProperty(window, 'Notification', {
    value: jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      close: jest.fn()
    }))
  });
  Object.defineProperty(Notification, 'permission', { value: 'granted' });
  Object.defineProperty(Notification, 'requestPermission', {
    value: jest.fn().mockResolvedValue('granted')
  });

  // Other APIs
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }
  });

  Object.defineProperty(window, 'requestAnimationFrame', {
    value: jest.fn().mockImplementation((callback) => { callback(); return 1; })
  });

  Object.defineProperty(global, 'crypto', {
    value: { subtle: { digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)) } }
  });

  // Worker and WebAssembly
  Object.defineProperty(window, 'Worker', { value: function Worker() {} });
  Object.defineProperty(window, 'WebAssembly', { value: {} });
  Object.defineProperty(window, 'File', { value: function File() {} });
  Object.defineProperty(window, 'FileReader', { value: function FileReader() {} });

  // Trigger IndexedDB success
  setTimeout(() => {
    if (mockIDBRequest.onsuccess) {
      mockIDBRequest.onsuccess();
    }
  }, 0);

  return mockIDBRequest;
};

describe('Error Handling System Integration', () => {
  let serviceErrorHandler: ServiceErrorHandler;
  let dataIntegrityManager: DataIntegrityManager;
  let notificationSystem: NotificationSystem;
  let offlineCapabilities: OfflineCapabilities;
  let automaticRecovery: AutomaticRecovery;
  let progressiveEnhancement: ProgressiveEnhancement;

  beforeEach(async () => {
    setupMocks();

    // Initialize all services
    serviceErrorHandler = new ServiceErrorHandler();
    dataIntegrityManager = new DataIntegrityManager();
    notificationSystem = new NotificationSystem();
    offlineCapabilities = new OfflineCapabilities();
    progressiveEnhancement = new ProgressiveEnhancement();

    // Wait for async initialization
    await new Promise(resolve => setTimeout(resolve, 10));

    automaticRecovery = new AutomaticRecovery(
      serviceErrorHandler,
      dataIntegrityManager,
      notificationSystem,
      offlineCapabilities
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    offlineCapabilities.destroy();
  });

  describe('end-to-end error recovery scenarios', () => {
    it('should handle network error with automatic recovery', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'photopea',
        message: 'Network connection failed',
        timestamp: Date.now(),
        retryable: true
      };

      // Test the full recovery flow
      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Network connection restored');

      // Verify error was logged
      const errorHistory = serviceErrorHandler.getErrorHistory();
      expect(errorHistory).toHaveLength(1);
      expect(errorHistory[0]).toEqual(error);
    });

    it('should switch to alternative service when primary fails', async () => {
      const error: ServiceError = {
        type: 'SERVICE_UNAVAILABLE',
        serviceId: 'photopea',
        message: 'Service unavailable',
        timestamp: Date.now(),
        retryable: true
      };

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toContain('alternative service');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should handle offline scenario with local processing', async () => {
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'canvas-manager',
        message: 'Network error',
        timestamp: Date.now(),
        retryable: true
      };

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Switched to offline mode');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should recover data from checkpoint after corruption', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: 'creative-studio',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      // Create a checkpoint
      jest.spyOn(dataIntegrityManager as any, 'getWorkspace').mockResolvedValue(workspace);
      const checkpoint = await dataIntegrityManager.createCheckpoint('test-workspace');

      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Data corruption detected',
        timestamp: Date.now(),
        retryable: true,
        context: { hasDataLoss: true, workspaceId: 'test-workspace' }
      };

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Data restored from checkpoint');
    });

    it('should apply progressive enhancement based on capabilities', () => {
      const capabilities = progressiveEnhancement.getCapabilities();

      // Should detect modern browser capabilities
      expect(capabilities.webWorkers).toBe(true);
      expect(capabilities.serviceWorkers).toBe(true);
      expect(capabilities.indexedDB).toBe(true);

      // Apply enhancement
      progressiveEnhancement.applyProgressiveEnhancement('file-processing');

      expect(progressiveEnhancement.isFeatureActive('file-processing')).toBe(true);
    });

    it('should gracefully degrade when features fail', () => {
      const error = new Error('Feature failed');
      
      // First activate the feature
      progressiveEnhancement.applyProgressiveEnhancement('file-processing');
      expect(progressiveEnhancement.isFeatureActive('file-processing')).toBe(true);

      // Then simulate failure
      progressiveEnhancement.gracefulDegradation('file-processing', error);

      expect(progressiveEnhancement.isFeatureActive('file-processing')).toBe(false);
    });
  });

  describe('cross-service integration', () => {
    it('should coordinate between error handler and notification system', async () => {
      const showSpy = jest.spyOn(notificationSystem, 'show');

      const error: ServiceError = {
        type: 'VALIDATION_ERROR',
        serviceId: 'test-service',
        message: 'Invalid data',
        timestamp: Date.now(),
        retryable: false
      };

      // Remove all recovery strategies to force unrecoverable error
      const strategies = automaticRecovery.getRecoveryStrategies();
      strategies.forEach(strategy => {
        automaticRecovery.removeRecoveryStrategy(strategy.id);
      });

      await automaticRecovery.handleError(error);

      expect(showSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Service Error'
        })
      );
    });

    it('should integrate offline capabilities with error recovery', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: 'creative-studio',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      // Save workspace offline
      await offlineCapabilities.saveWorkspaceOffline(workspace);

      // Verify it was queued for sync
      const pendingOperations = offlineCapabilities.getPendingOperations();
      expect(pendingOperations.length).toBeGreaterThan(0);
      expect(pendingOperations[0].type).toBe('workspace-save');
    });

    it('should validate data integrity during error recovery', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: 'creative-studio',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      const validation = await dataIntegrityManager.validateWorkspaceData(workspace);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should handle cascading failures across multiple services', async () => {
      // Simulate multiple service failures
      const errors: ServiceError[] = [
        {
          type: 'NETWORK_ERROR',
          serviceId: 'photopea',
          message: 'Network error',
          timestamp: Date.now(),
          retryable: true
        },
        {
          type: 'SERVICE_UNAVAILABLE',
          serviceId: 'pixlr',
          message: 'Alternative service also unavailable',
          timestamp: Date.now() + 1000,
          retryable: true
        }
      ];

      const results = await Promise.all(
        errors.map(error => automaticRecovery.handleError(error))
      );

      // Should handle both errors
      expect(results).toHaveLength(2);
      expect(results.every(result => result.success)).toBe(true);

      // Should track service health
      const health = automaticRecovery.getServiceHealth();
      expect(health['photopea']).toBe('recovering');
      expect(health['pixlr']).toBe('recovering');
    });
  });

  describe('performance and resource management', () => {
    it('should limit error history to prevent memory leaks', async () => {
      // Generate many errors
      for (let i = 0; i < 150; i++) {
        const error: ServiceError = {
          type: 'NETWORK_ERROR',
          serviceId: 'test-service',
          message: `Error ${i}`,
          timestamp: Date.now() + i,
          retryable: true
        };
        await serviceErrorHandler.handleServiceError(error);
      }

      const history = serviceErrorHandler.getErrorHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should limit number of notifications', () => {
      // Show many notifications
      for (let i = 0; i < 10; i++) {
        notificationSystem.show({
          title: `Notification ${i}`,
          message: `Message ${i}`,
          type: 'info'
        });
      }

      const activeNotifications = notificationSystem.getActiveNotifications();
      expect(activeNotifications.length).toBeLessThanOrEqual(5);
    });

    it('should limit number of checkpoints', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: 'creative-studio',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      jest.spyOn(dataIntegrityManager as any, 'getWorkspace').mockResolvedValue(workspace);

      // Create many checkpoints
      for (let i = 0; i < 15; i++) {
        await dataIntegrityManager.createCheckpoint('test-workspace', `Checkpoint ${i}`);
      }

      const checkpoints = dataIntegrityManager.getCheckpoints('test-workspace');
      expect(checkpoints.length).toBeLessThanOrEqual(10);
    });
  });

  describe('user experience scenarios', () => {
    it('should provide contextual error messages', async () => {
      const error: ServiceError = {
        type: 'RATE_LIMITED',
        serviceId: 'gtmetrix',
        message: 'Rate limit exceeded',
        timestamp: Date.now(),
        retryable: true,
        context: { retryAfter: 60000 }
      };

      const resolution = await serviceErrorHandler.handleServiceError(error);

      expect(resolution.message).toContain('Rate limit reached');
      expect(resolution.message).toContain('60 seconds');
    });

    it('should show appropriate notifications for different error types', async () => {
      const showSpy = jest.spyOn(notificationSystem, 'show');

      // Test different error scenarios
      const scenarios = [
        {
          error: {
            type: 'NETWORK_ERROR' as const,
            serviceId: 'test-service',
            message: 'Network error',
            timestamp: Date.now(),
            retryable: true
          },
          expectedNotificationType: 'warning'
        },
        {
          error: {
            type: 'VALIDATION_ERROR' as const,
            serviceId: 'test-service',
            message: 'Invalid data',
            timestamp: Date.now(),
            retryable: false
          },
          expectedNotificationType: 'error'
        }
      ];

      for (const scenario of scenarios) {
        await automaticRecovery.handleError(scenario.error);
      }

      // Should have shown notifications
      expect(showSpy).toHaveBeenCalled();
    });

    it('should provide recovery actions in notifications', async () => {
      const showSpy = jest.spyOn(notificationSystem, 'show');

      const error: ServiceError = {
        type: 'VALIDATION_ERROR',
        serviceId: 'test-service',
        message: 'Invalid data',
        timestamp: Date.now(),
        retryable: false
      };

      // Remove recovery strategies to force error notification
      const strategies = automaticRecovery.getRecoveryStrategies();
      strategies.forEach(strategy => {
        automaticRecovery.removeRecoveryStrategy(strategy.id);
      });

      await automaticRecovery.handleError(error);

      expect(showSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({
              id: 'retry',
              label: 'Retry'
            })
          ])
        })
      );
    });
  });

  describe('configuration and customization', () => {
    it('should respect user preferences for recovery behavior', async () => {
      automaticRecovery.setPreferences({
        autoRetry: false,
        useAlternativeServices: false,
        showRecoveryNotifications: false
      });

      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Network error',
        timestamp: Date.now(),
        retryable: true
      };

      const result = await automaticRecovery.handleError(error);

      // Should not use retry or alternative services
      expect(result.message).not.toContain('Retrying');
      expect(result.message).not.toContain('alternative');
    });

    it('should allow custom recovery strategies', async () => {
      const customStrategy = {
        id: 'custom-recovery',
        name: 'Custom Recovery',
        priority: 1000,
        canRecover: () => true,
        recover: async () => ({
          success: true,
          message: 'Custom recovery successful'
        })
      };

      automaticRecovery.addRecoveryStrategy(customStrategy);

      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Network error',
        timestamp: Date.now(),
        retryable: true
      };

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Custom recovery successful');
    });

    it('should support feature-specific progressive enhancement', () => {
      // Test different features
      const features = [
        'file-processing',
        'real-time-collaboration',
        'offline-sync',
        'advanced-editing'
      ];

      features.forEach(feature => {
        progressiveEnhancement.applyProgressiveEnhancement(feature);
        expect(progressiveEnhancement.isFeatureActive(feature)).toBe(true);
      });

      const activeFeatures = progressiveEnhancement.getActiveFeatures();
      expect(activeFeatures).toHaveLength(features.length);
    });
  });

  describe('monitoring and analytics', () => {
    it('should track error patterns and service health', async () => {
      const errors: ServiceError[] = [
        {
          type: 'NETWORK_ERROR',
          serviceId: 'service-a',
          message: 'Error 1',
          timestamp: Date.now(),
          retryable: true
        },
        {
          type: 'TIMEOUT',
          serviceId: 'service-a',
          message: 'Error 2',
          timestamp: Date.now() + 1000,
          retryable: true
        },
        {
          type: 'SERVICE_UNAVAILABLE',
          serviceId: 'service-b',
          message: 'Error 3',
          timestamp: Date.now() + 2000,
          retryable: true
        }
      ];

      for (const error of errors) {
        await automaticRecovery.handleError(error);
      }

      const health = automaticRecovery.getServiceHealth();
      expect(health['service-a']).toBe('recovering');
      expect(health['service-b']).toBe('recovering');

      const historyA = automaticRecovery.getRecoveryHistory('service-a');
      const historyB = automaticRecovery.getRecoveryHistory('service-b');
      expect(historyA).toHaveLength(2);
      expect(historyB).toHaveLength(1);
    });

    it('should provide comprehensive system status', () => {
      const syncStatus = offlineCapabilities.getSyncStatus();
      const storageUsage = offlineCapabilities.getStorageUsage();
      const capabilities = progressiveEnhancement.getCapabilities();
      const serviceHealth = automaticRecovery.getServiceHealth();

      expect(syncStatus).toHaveProperty('isOnline');
      expect(syncStatus).toHaveProperty('pendingOperations');
      expect(storageUsage).toHaveProperty('workspaces');
      expect(capabilities).toHaveProperty('webWorkers');
      expect(typeof serviceHealth).toBe('object');
    });
  });
});