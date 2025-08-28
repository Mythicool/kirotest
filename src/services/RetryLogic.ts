export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs: number;
  retryableErrors: string[];
  timeoutMs: number;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export interface RetryAttempt {
  attemptNumber: number;
  delay: number;
  error?: Error;
  timestamp: number;
}

export class RetryLogic {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitterMs: 100,
      retryableErrors: [
        'NetworkError',
        'TimeoutError',
        'ServiceUnavailable',
        'RateLimited',
        'TemporaryFailure'
      ],
      timeoutMs: 60000,
      ...config
    };
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const config = { ...this.config, ...customConfig };
    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      const attemptStartTime = Date.now();
      
      try {
        // Check if we've exceeded total timeout
        if (Date.now() - startTime > config.timeoutMs) {
          throw new Error('Total retry timeout exceeded');
        }

        const result = await operation();
        
        return {
          success: true,
          result,
          attempts: attempt,
          totalTime: Date.now() - startTime
        };

      } catch (error) {
        lastError = error as Error;
        
        attempts.push({
          attemptNumber: attempt,
          delay: 0,
          error: lastError,
          timestamp: attemptStartTime
        });

        // Check if error is retryable
        if (!this.isRetryableError(lastError, config)) {
          break;
        }

        // Don't delay after the last attempt
        if (attempt < config.maxAttempts) {
          const delay = this.calculateDelay(attempt, config);
          attempts[attempts.length - 1].delay = delay;
          
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: attempts.length,
      totalTime: Date.now() - startTime
    };
  }

  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitBreakerConfig?: {
      failureThreshold: number;
      resetTimeoutMs: number;
      monitoringPeriodMs: number;
    }
  ): Promise<T> {
    const cbConfig = {
      failureThreshold: 5,
      resetTimeoutMs: 60000,
      monitoringPeriodMs: 300000,
      ...circuitBreakerConfig
    };

    const circuitBreaker = this.getOrCreateCircuitBreaker(
      operation.toString(),
      cbConfig
    );

    return circuitBreaker.execute(operation);
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff with jitter
    const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * config.jitterMs;
    const delay = Math.min(exponentialDelay + jitter, config.maxDelayMs);
    
    return Math.floor(delay);
  }

  private isRetryableError(error: Error, config: RetryConfig): boolean {
    // Check error type/name
    if (config.retryableErrors.includes(error.name)) {
      return true;
    }

    // Check error message for common retryable patterns
    const retryablePatterns = [
      /network.*error/i,
      /timeout/i,
      /connection.*reset/i,
      /service.*unavailable/i,
      /rate.*limit/i,
      /too.*many.*requests/i,
      /temporary.*failure/i,
      /502|503|504/,
      /ECONNRESET|ENOTFOUND|ETIMEDOUT/
    ];

    return retryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Circuit Breaker implementation
  private circuitBreakers = new Map<string, CircuitBreaker>();

  private getOrCreateCircuitBreaker(
    operationId: string,
    config: {
      failureThreshold: number;
      resetTimeoutMs: number;
      monitoringPeriodMs: number;
    }
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(operationId)) {
      this.circuitBreakers.set(operationId, new CircuitBreaker(config));
    }
    return this.circuitBreakers.get(operationId)!;
  }
}

enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private config: {
    failureThreshold: number;
    resetTimeoutMs: number;
    monitoringPeriodMs: number;
  };

  constructor(config: {
    failureThreshold: number;
    resetTimeoutMs: number;
    monitoringPeriodMs: number;
  }) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeoutMs) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - operation not allowed');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = CircuitBreakerState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats(): {
    state: CircuitBreakerState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Utility functions for common retry scenarios
export class RetryStrategies {
  static readonly NETWORK_REQUEST = new RetryLogic({
    maxAttempts: 3,
    baseDelayMs: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['NetworkError', 'TimeoutError', 'fetch']
  });

  static readonly API_CALL = new RetryLogic({
    maxAttempts: 5,
    baseDelayMs: 500,
    maxDelayMs: 10000,
    backoffMultiplier: 1.5,
    retryableErrors: ['ServiceUnavailable', 'RateLimited', '502', '503', '504']
  });

  static readonly FILE_OPERATION = new RetryLogic({
    maxAttempts: 2,
    baseDelayMs: 2000,
    backoffMultiplier: 2,
    retryableErrors: ['FileSystemError', 'TemporaryFailure']
  });

  static readonly TOOL_COMMUNICATION = new RetryLogic({
    maxAttempts: 4,
    baseDelayMs: 800,
    maxDelayMs: 8000,
    backoffMultiplier: 2,
    jitterMs: 200,
    retryableErrors: ['CommunicationError', 'TimeoutError', 'ToolNotReady']
  });
}

// Decorator for automatic retry
export function withRetry(retryLogic: RetryLogic = RetryStrategies.NETWORK_REQUEST) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await retryLogic.executeWithRetry(() => 
        originalMethod.apply(this, args)
      );

      if (result.success) {
        return result.result;
      } else {
        throw result.error;
      }
    };

    return descriptor;
  };
}