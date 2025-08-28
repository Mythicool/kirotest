import { AutomaticRecovery } from '@/services/AutomaticRecovery';
import { ServiceErrorHandler, ServiceError } from '@/services/ServiceErrorHandler';
import { DataIntegrityManager } from '@/services/DataIntegrityManager';
import { NotificationSystem } from '@/services/NotificationSystem';
import { OfflineCapabilities } from '@/services/OfflineCapabilities';

// Mock dependencies
jest.mock('@/services/ServiceErrorHandler');
jest.mock('@/services/DataIntegrityManager');
jest.mock('@/services/NotificationSystem');
jest.mock('@/services/OfflineCapabilities');

describe('AutomaticRecovery', () => {
  let automaticRecovery: AutomaticRecovery;
  let mockServiceErrorHandler: jest.Mocked<ServiceErrorHandler>;
  let mockDataIntegrityManager: jest.Mocked<DataIntegrityManager>;
  let mockNotificationSystem: jest.Mocked<NotificationSystem>;
  let mockOfflineCapabilities: jest.Mocked<OfflineCapabilities>;

  beforeEach(() => {
    mockServiceErrorHandler = new ServiceErrorHandler() as jest.Mocked<ServiceErrorHandler>;
    mockDataIntegrityManager = new DataIntegrityManager() as jest.Mocked<DataIntegrityManager>;
    mockNotificationSystem = new NotificationSystem() as jest.Mocked<NotificationSystem>;
    mockOfflineCapabilities = new OfflineCapabilities() as jest.Mocked<OfflineCapabilities>;

    automaticRecovery = new AutomaticRecovery(
      mockServiceErrorHandler,
      mockDataIntegrityManager,
      mockNotificationSystem,
      mockOfflineCapabilities
    );

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should successfully recover from network error when back online', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Network connection failed',
        timestamp: Date.now(),
        retryable: true
      };

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Network connection restored');
    });

    it('should switch to offline mode when network is unavailable', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'canvas-manager',
        message: 'Network connection failed',
        timestamp: Date.now(),
        retryable: true
      };

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Switched to offline mode');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should use alternative service for service unavailable error', async () => {
      const error: ServiceError = {
        type: 'SERVICE_UNAVAILABLE',
        serviceId: 'photopea',
        message: 'Service unavailable',
        timestamp: Date.now(),
        retryable: true
      };

      mockServiceErrorHandler.handleServiceError.mockResolvedValue({
        action: 'RETRY_WITH_ALTERNATIVE',
        alternatives: ['pixlr']
      });

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toContain('alternative service');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should recover data from checkpoint', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Data loss detected',
        timestamp: Date.now(),
        retryable: true,
        context: { hasDataLoss: true, workspaceId: 'test-workspace' }
      };

      const mockCheckpoint = {
        id: 'checkpoint-1',
        workspaceId: 'test-workspace',
        timestamp: Date.now(),
        data: {},
        metadata: {
          version: '1.0',
          description: 'Test checkpoint',
          fileCount: 0,
          dataSize: 100,
          checksum: 'abc123'
        }
      };

      mockDataIntegrityManager.getCheckpoints.mockReturnValue([mockCheckpoint]);
      mockDataIntegrityManager.restoreCheckpoint.mockResolvedValue({
        id: 'test-workspace',
        name: 'Test Workspace',
        type: WorkspaceType.CREATIVE_STUDIO,
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      });

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Data restored from checkpoint');
      expect(mockDataIntegrityManager.restoreCheckpoint).toHaveBeenCalledWith('checkpoint-1');
    });

    it('should retry operation with exponential backoff', async () => {
      const error: ServiceError = {
        type: 'TIMEOUT',
        serviceId: 'test-service',
        message: 'Request timeout',
        timestamp: Date.now(),
        retryable: true
      };

      // Set preferences to enable auto retry
      automaticRecovery.setPreferences({ autoRetry: true, maxRetries: 3 });

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Retrying operation');
    });

    it('should use cached data when available', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Network error',
        timestamp: Date.now(),
        retryable: true,
        context: { hasCachedData: true, cachedData: { content: 'cached content' } }
      };

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Using cached data');
      expect(result.fallbackUsed).toBe(true);
      expect(result.data).toEqual({ content: 'cached content' });
    });

    it('should fall back to graceful degradation as last resort', async () => {
      const error: ServiceError = {
        type: 'UNKNOWN',
        serviceId: 'unknown-service',
        message: 'Unknown error',
        timestamp: Date.now(),
        retryable: false
      };

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Switched to basic functionality mode');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should handle max retries exceeded', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Network error',
        timestamp: Date.now(),
        retryable: true
      };

      automaticRecovery.setPreferences({ maxRetries: 1 });

      // First error
      await automaticRecovery.handleError(error);
      
      // Second error should exceed max retries
      const result = await automaticRecovery.handleError(error);

      expect(mockNotificationSystem.error).toHaveBeenCalledWith(
        'Recovery Failed',
        expect.stringContaining('after 2 attempts'),
        expect.any(Object)
      );
    });

    it('should handle unrecoverable errors', async () => {
      const error: ServiceError = {
        type: 'VALIDATION_ERROR',
        serviceId: 'test-service',
        message: 'Invalid data',
        timestamp: Date.now(),
        retryable: false
      };

      // Remove all recovery strategies to simulate unrecoverable error
      const strategies = automaticRecovery.getRecoveryStrategies();
      strategies.forEach(strategy => {
        automaticRecovery.removeRecoveryStrategy(strategy.id);
      });

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unable to recover');
      expect(mockNotificationSystem.error).toHaveBeenCalled();
    });
  });

  describe('recovery preferences', () => {
    it('should update preferences', () => {
      const newPreferences = {
        autoRetry: false,
        maxRetries: 5,
        useAlternativeServices: false
      };

      automaticRecovery.setPreferences(newPreferences);
      const preferences = automaticRecovery.getPreferences();

      expect(preferences.autoRetry).toBe(false);
      expect(preferences.maxRetries).toBe(5);
      expect(preferences.useAlternativeServices).toBe(false);
      expect(preferences.enableOfflineMode).toBe(true); // Should keep existing values
    });

    it('should respect disabled auto retry preference', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Network error',
        timestamp: Date.now(),
        retryable: true
      };

      automaticRecovery.setPreferences({ autoRetry: false });

      const result = await automaticRecovery.handleError(error);

      // Should not use retry strategy
      expect(result.message).not.toContain('Retrying operation');
    });

    it('should respect disabled alternative services preference', async () => {
      const error: ServiceError = {
        type: 'SERVICE_UNAVAILABLE',
        serviceId: 'photopea',
        message: 'Service unavailable',
        timestamp: Date.now(),
        retryable: true
      };

      automaticRecovery.setPreferences({ useAlternativeServices: false });

      const result = await automaticRecovery.handleError(error);

      expect(mockServiceErrorHandler.handleServiceError).not.toHaveBeenCalled();
    });
  });

  describe('service health monitoring', () => {
    it('should report healthy service with no errors', () => {
      const health = automaticRecovery.getServiceHealth();
      expect(Object.keys(health)).toHaveLength(0);
    });

    it('should report recovering service with active retries', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Network error',
        timestamp: Date.now(),
        retryable: true
      };

      await automaticRecovery.handleError(error);

      const health = automaticRecovery.getServiceHealth();
      expect(health['test-service']).toBe('recovering');
    });

    it('should report failed service after max retries', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Network error',
        timestamp: Date.now(),
        retryable: true
      };

      automaticRecovery.setPreferences({ maxRetries: 1 });

      // Exceed max retries
      await automaticRecovery.handleError(error);
      await automaticRecovery.handleError(error);

      const health = automaticRecovery.getServiceHealth();
      expect(health['test-service']).toBe('failed');
    });
  });

  describe('recovery history', () => {
    it('should track recovery history per service', async () => {
      const error1: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'service-1',
        message: 'Error 1',
        timestamp: Date.now(),
        retryable: true
      };

      const error2: ServiceError = {
        type: 'TIMEOUT',
        serviceId: 'service-1',
        message: 'Error 2',
        timestamp: Date.now() + 1000,
        retryable: true
      };

      await automaticRecovery.handleError(error1);
      await automaticRecovery.handleError(error2);

      const history = automaticRecovery.getRecoveryHistory('service-1');
      expect(history).toHaveLength(2);
      expect(history[0].message).toBe('Error 1');
      expect(history[1].message).toBe('Error 2');
    });

    it('should clear recovery history', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Test error',
        timestamp: Date.now(),
        retryable: true
      };

      await automaticRecovery.handleError(error);
      expect(automaticRecovery.getRecoveryHistory('test-service')).toHaveLength(1);

      automaticRecovery.clearRecoveryHistory('test-service');
      expect(automaticRecovery.getRecoveryHistory('test-service')).toHaveLength(0);
    });

    it('should clear all recovery history', async () => {
      const error1: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'service-1',
        message: 'Error 1',
        timestamp: Date.now(),
        retryable: true
      };

      const error2: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'service-2',
        message: 'Error 2',
        timestamp: Date.now(),
        retryable: true
      };

      await automaticRecovery.handleError(error1);
      await automaticRecovery.handleError(error2);

      automaticRecovery.clearRecoveryHistory();

      expect(automaticRecovery.getRecoveryHistory('service-1')).toHaveLength(0);
      expect(automaticRecovery.getRecoveryHistory('service-2')).toHaveLength(0);
    });
  });

  describe('custom recovery strategies', () => {
    it('should add custom recovery strategy', () => {
      const customStrategy = {
        id: 'custom-strategy',
        name: 'Custom Strategy',
        priority: 200,
        canRecover: () => true,
        recover: async () => ({ success: true, message: 'Custom recovery' })
      };

      automaticRecovery.addRecoveryStrategy(customStrategy);

      const strategies = automaticRecovery.getRecoveryStrategies();
      expect(strategies.some(s => s.id === 'custom-strategy')).toBe(true);
    });

    it('should remove recovery strategy', () => {
      const strategies = automaticRecovery.getRecoveryStrategies();
      const initialCount = strategies.length;

      automaticRecovery.removeRecoveryStrategy('retry');

      const updatedStrategies = automaticRecovery.getRecoveryStrategies();
      expect(updatedStrategies).toHaveLength(initialCount - 1);
      expect(updatedStrategies.some(s => s.id === 'retry')).toBe(false);
    });

    it('should use custom strategy with higher priority', async () => {
      const customStrategy = {
        id: 'high-priority-strategy',
        name: 'High Priority Strategy',
        priority: 1000,
        canRecover: () => true,
        recover: async () => ({ success: true, message: 'High priority recovery' })
      };

      automaticRecovery.addRecoveryStrategy(customStrategy);

      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Test error',
        timestamp: Date.now(),
        retryable: true
      };

      const result = await automaticRecovery.handleError(error);

      expect(result.success).toBe(true);
      expect(result.message).toBe('High priority recovery');
    });
  });
});