import { ServiceErrorHandler, ServiceError } from '@/services/ServiceErrorHandler';
import { RetryLogic } from '@/services/RetryLogic';

// Mock RetryLogic
jest.mock('@/services/RetryLogic');

describe('ServiceErrorHandler', () => {
  let errorHandler: ServiceErrorHandler;
  let mockRetryLogic: jest.Mocked<RetryLogic>;

  beforeEach(() => {
    mockRetryLogic = new RetryLogic() as jest.Mocked<RetryLogic>;
    mockRetryLogic.getNextDelay.mockReturnValue(1000);
    
    errorHandler = new ServiceErrorHandler();
    (errorHandler as any).retryLogic = mockRetryLogic;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleServiceError', () => {
    it('should handle network errors correctly', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Network connection failed',
        timestamp: Date.now(),
        retryable: true
      };

      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const resolution = await errorHandler.handleServiceError(error);

      expect(resolution.action).toBe('QUEUE_FOR_RETRY');
      expect(resolution.retryAfter).toBe(5000);
      expect(resolution.message).toContain('No internet connection');
    });

    it('should try alternative services for network errors when online', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'photopea',
        message: 'Network connection failed',
        timestamp: Date.now(),
        retryable: true
      };

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      const resolution = await errorHandler.handleServiceError(error);

      expect(resolution.action).toBe('RETRY_WITH_ALTERNATIVE');
      expect(resolution.alternatives).toContain('pixlr');
    });

    it('should handle service unavailable errors', async () => {
      const error: ServiceError = {
        type: 'SERVICE_UNAVAILABLE',
        serviceId: 'replit',
        message: 'Service is temporarily unavailable',
        timestamp: Date.now(),
        retryable: true
      };

      const resolution = await errorHandler.handleServiceError(error);

      expect(resolution.action).toBe('RETRY_WITH_ALTERNATIVE');
      expect(resolution.alternatives).toEqual(['codepen', 'jsbin']);
    });

    it('should handle rate limit errors', async () => {
      const error: ServiceError = {
        type: 'RATE_LIMITED',
        serviceId: 'gtmetrix',
        message: 'Rate limit exceeded',
        timestamp: Date.now(),
        retryable: true,
        context: { retryAfter: 30000 }
      };

      const resolution = await errorHandler.handleServiceError(error);

      expect(resolution.action).toBe('RETRY_WITH_ALTERNATIVE');
      expect(resolution.alternatives).toContain('pingdom');
    });

    it('should handle timeout errors', async () => {
      const error: ServiceError = {
        type: 'TIMEOUT',
        serviceId: 'cloud-convert',
        message: 'Request timeout',
        timestamp: Date.now(),
        retryable: true
      };

      const resolution = await errorHandler.handleServiceError(error);

      expect(resolution.action).toBe('RETRY_WITH_ALTERNATIVE');
      expect(resolution.alternatives).toContain('pandoc');
    });

    it('should handle validation errors', async () => {
      const error: ServiceError = {
        type: 'VALIDATION_ERROR',
        serviceId: 'test-service',
        message: 'Invalid input data',
        timestamp: Date.now(),
        retryable: false
      };

      const resolution = await errorHandler.handleServiceError(error);

      expect(resolution.action).toBe('SHOW_ERROR');
      expect(resolution.message).toContain('Invalid data');
    });

    it('should switch to offline mode when available', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'canvas-manager',
        message: 'Network error',
        timestamp: Date.now(),
        retryable: true
      };

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const resolution = await errorHandler.handleServiceError(error);

      expect(resolution.action).toBe('SWITCH_TO_OFFLINE');
      expect(resolution.message).toContain('Working offline');
    });
  });

  describe('error history tracking', () => {
    it('should track error history', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Test error',
        timestamp: Date.now(),
        retryable: true
      };

      await errorHandler.handleServiceError(error);

      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(error);
    });

    it('should limit error history to 100 entries', async () => {
      // Add 101 errors
      for (let i = 0; i < 101; i++) {
        const error: ServiceError = {
          type: 'NETWORK_ERROR',
          serviceId: 'test-service',
          message: `Error ${i}`,
          timestamp: Date.now() + i,
          retryable: true
        };
        await errorHandler.handleServiceError(error);
      }

      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(100);
      expect(history[0].message).toBe('Error 1'); // First error should be removed
    });

    it('should clear error history', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Test error',
        timestamp: Date.now(),
        retryable: true
      };

      await errorHandler.handleServiceError(error);
      expect(errorHandler.getErrorHistory()).toHaveLength(1);

      errorHandler.clearErrorHistory();
      expect(errorHandler.getErrorHistory()).toHaveLength(0);
    });
  });

  describe('service health monitoring', () => {
    it('should report healthy service with no recent errors', () => {
      const health = errorHandler.getServiceHealth('test-service');
      expect(health).toBe('healthy');
    });

    it('should report degraded service with few recent errors', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Test error',
        timestamp: Date.now(),
        retryable: true
      };

      await errorHandler.handleServiceError(error);
      await errorHandler.handleServiceError(error);

      const health = errorHandler.getServiceHealth('test-service');
      expect(health).toBe('degraded');
    });

    it('should report unavailable service with many recent errors', async () => {
      const error: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Test error',
        timestamp: Date.now(),
        retryable: true
      };

      // Add 3 recent errors
      for (let i = 0; i < 3; i++) {
        await errorHandler.handleServiceError({
          ...error,
          timestamp: Date.now() - i * 1000
        });
      }

      const health = errorHandler.getServiceHealth('test-service');
      expect(health).toBe('unavailable');
    });

    it('should not count old errors in health calculation', async () => {
      const oldError: ServiceError = {
        type: 'NETWORK_ERROR',
        serviceId: 'test-service',
        message: 'Old error',
        timestamp: Date.now() - 400000, // 6+ minutes ago
        retryable: true
      };

      await errorHandler.handleServiceError(oldError);

      const health = errorHandler.getServiceHealth('test-service');
      expect(health).toBe('healthy');
    });
  });
});