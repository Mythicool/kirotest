import { ServiceErrorHandler, ServiceError, ErrorResolution } from './ServiceErrorHandler';
import { DataIntegrityManager } from './DataIntegrityManager';
import { NotificationSystem } from './NotificationSystem';
import { OfflineCapabilities } from './OfflineCapabilities';

export interface RecoveryStrategy {
  id: string;
  name: string;
  priority: number;
  canRecover: (error: ServiceError) => boolean;
  recover: (error: ServiceError) => Promise<RecoveryResult>;
}

export interface RecoveryResult {
  success: boolean;
  message: string;
  data?: any;
  fallbackUsed?: boolean;
  retryAfter?: number;
}

export interface RecoveryContext {
  errorHistory: ServiceError[];
  retryAttempts: number;
  lastSuccessfulOperation?: Date;
  userPreferences: RecoveryPreferences;
}

export interface RecoveryPreferences {
  autoRetry: boolean;
  maxRetries: number;
  useAlternativeServices: boolean;
  enableOfflineMode: boolean;
  showRecoveryNotifications: boolean;
}

export class AutomaticRecovery {
  private serviceErrorHandler: ServiceErrorHandler;
  private dataIntegrityManager: DataIntegrityManager;
  private notificationSystem: NotificationSystem;
  private offlineCapabilities: OfflineCapabilities;
  private recoveryStrategies: Map<string, RecoveryStrategy>;
  private recoveryContext: Map<string, RecoveryContext>;
  private preferences: RecoveryPreferences;

  constructor(
    serviceErrorHandler: ServiceErrorHandler,
    dataIntegrityManager: DataIntegrityManager,
    notificationSystem: NotificationSystem,
    offlineCapabilities: OfflineCapabilities
  ) {
    this.serviceErrorHandler = serviceErrorHandler;
    this.dataIntegrityManager = dataIntegrityManager;
    this.notificationSystem = notificationSystem;
    this.offlineCapabilities = offlineCapabilities;
    this.recoveryStrategies = new Map();
    this.recoveryContext = new Map();
    
    this.preferences = {
      autoRetry: true,
      maxRetries: 3,
      useAlternativeServices: true,
      enableOfflineMode: true,
      showRecoveryNotifications: true
    };

    this.initializeRecoveryStrategies();
  }

  async handleError(error: ServiceError): Promise<RecoveryResult> {
    // Get or create recovery context
    const context = this.getRecoveryContext(error.serviceId);
    context.errorHistory.push(error);
    context.retryAttempts++;

    // Find applicable recovery strategies
    const strategies = this.findRecoveryStrategies(error);
    
    if (strategies.length === 0) {
      return this.handleUnrecoverableError(error);
    }

    // Try recovery strategies in priority order
    for (const strategy of strategies) {
      try {
        const result = await strategy.recover(error);
        
        if (result.success) {
          this.onRecoverySuccess(error, strategy, result);
          return result;
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy ${strategy.name} failed:`, recoveryError);
      }
    }

    // All recovery strategies failed
    return this.handleRecoveryFailure(error, context);
  }

  private findRecoveryStrategies(error: ServiceError): RecoveryStrategy[] {
    const applicableStrategies = Array.from(this.recoveryStrategies.values())
      .filter(strategy => strategy.canRecover(error))
      .sort((a, b) => b.priority - a.priority);

    return applicableStrategies;
  }

  private getRecoveryContext(serviceId: string): RecoveryContext {
    if (!this.recoveryContext.has(serviceId)) {
      this.recoveryContext.set(serviceId, {
        errorHistory: [],
        retryAttempts: 0,
        userPreferences: this.preferences
      });
    }
    return this.recoveryContext.get(serviceId)!;
  }

  private async handleUnrecoverableError(error: ServiceError): Promise<RecoveryResult> {
    if (this.preferences.showRecoveryNotifications) {
      this.notificationSystem.error(
        'Service Error',
        `${error.message}. Please try again later.`,
        {
          persistent: true,
          actions: [
            {
              id: 'retry',
              label: 'Retry',
              action: () => this.retryOperation(error)
            }
          ]
        }
      );
    }

    return {
      success: false,
      message: `Unable to recover from error: ${error.message}`
    };
  }

  private async handleRecoveryFailure(error: ServiceError, context: RecoveryContext): Promise<RecoveryResult> {
    if (context.retryAttempts >= this.preferences.maxRetries) {
      // Max retries reached, give up
      if (this.preferences.showRecoveryNotifications) {
        this.notificationSystem.error(
          'Recovery Failed',
          `Unable to recover from ${error.serviceId} error after ${context.retryAttempts} attempts.`,
          {
            persistent: true,
            actions: [
              {
                id: 'reset',
                label: 'Reset Service',
                action: () => this.resetService(error.serviceId)
              }
            ]
          }
        );
      }

      return {
        success: false,
        message: `Recovery failed after ${context.retryAttempts} attempts`
      };
    }

    // Schedule retry
    const retryDelay = this.calculateRetryDelay(context.retryAttempts);
    
    if (this.preferences.showRecoveryNotifications) {
      this.notificationSystem.warning(
        'Retrying Operation',
        `Will retry in ${Math.round(retryDelay / 1000)} seconds...`,
        {
          duration: retryDelay
        }
      );
    }

    return {
      success: false,
      message: 'Recovery in progress',
      retryAfter: retryDelay
    };
  }

  private onRecoverySuccess(error: ServiceError, strategy: RecoveryStrategy, result: RecoveryResult): void {
    // Reset retry attempts
    const context = this.getRecoveryContext(error.serviceId);
    context.retryAttempts = 0;
    context.lastSuccessfulOperation = new Date();

    if (this.preferences.showRecoveryNotifications && result.fallbackUsed) {
      this.notificationSystem.info(
        'Service Recovered',
        `${strategy.name} was used to recover from the error.`,
        {
          duration: 3000
        }
      );
    }

    console.log(`Recovery successful using strategy: ${strategy.name}`);
  }

  private calculateRetryDelay(retryAttempts: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryAttempts), maxDelay);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    
    return exponentialDelay + jitter;
  }

  private async retryOperation(error: ServiceError): Promise<void> {
    // Reset retry attempts and try again
    const context = this.getRecoveryContext(error.serviceId);
    context.retryAttempts = 0;
    
    await this.handleError(error);
  }

  private async resetService(serviceId: string): Promise<void> {
    // Clear recovery context
    this.recoveryContext.delete(serviceId);
    
    // Notify user
    if (this.preferences.showRecoveryNotifications) {
      this.notificationSystem.info(
        'Service Reset',
        `${serviceId} has been reset. You can try using it again.`
      );
    }
  }

  private initializeRecoveryStrategies(): void {
    // Network Error Recovery
    this.recoveryStrategies.set('network-recovery', {
      id: 'network-recovery',
      name: 'Network Recovery',
      priority: 100,
      canRecover: (error) => error.type === 'NETWORK_ERROR',
      recover: async (error) => {
        // Check if we're back online
        if (navigator.onLine) {
          // Try the original service again
          return {
            success: true,
            message: 'Network connection restored'
          };
        }

        // Try offline mode if available
        if (this.preferences.enableOfflineMode) {
          const offlineResult = await this.tryOfflineMode(error);
          if (offlineResult.success) {
            return {
              success: true,
              message: 'Switched to offline mode',
              fallbackUsed: true,
              data: offlineResult.data
            };
          }
        }

        return {
          success: false,
          message: 'Network still unavailable'
        };
      }
    });

    // Service Alternative Recovery
    this.recoveryStrategies.set('alternative-service', {
      id: 'alternative-service',
      name: 'Alternative Service',
      priority: 90,
      canRecover: (error) => 
        error.type === 'SERVICE_UNAVAILABLE' || 
        error.type === 'TIMEOUT' ||
        error.type === 'RATE_LIMITED',
      recover: async (error) => {
        if (!this.preferences.useAlternativeServices) {
          return { success: false, message: 'Alternative services disabled' };
        }

        const resolution = await this.serviceErrorHandler.handleServiceError(error);
        
        if (resolution.action === 'RETRY_WITH_ALTERNATIVE' && resolution.alternatives) {
          return {
            success: true,
            message: `Switched to alternative service: ${resolution.alternatives[0]}`,
            fallbackUsed: true,
            data: { alternativeService: resolution.alternatives[0] }
          };
        }

        return { success: false, message: 'No alternative services available' };
      }
    });

    // Data Recovery Strategy
    this.recoveryStrategies.set('data-recovery', {
      id: 'data-recovery',
      name: 'Data Recovery',
      priority: 80,
      canRecover: (error) => error.context?.hasDataLoss === true,
      recover: async (error) => {
        try {
          // Try to restore from checkpoint
          const workspaceId = error.context?.workspaceId;
          if (workspaceId) {
            const checkpoints = this.dataIntegrityManager.getCheckpoints(workspaceId);
            if (checkpoints.length > 0) {
              const latestCheckpoint = checkpoints[checkpoints.length - 1];
              const restoredData = await this.dataIntegrityManager.restoreCheckpoint(latestCheckpoint.id);
              
              return {
                success: true,
                message: 'Data restored from checkpoint',
                data: restoredData
              };
            }
          }

          return { success: false, message: 'No recovery data available' };
        } catch (recoveryError) {
          return { 
            success: false, 
            message: `Data recovery failed: ${recoveryError.message}` 
          };
        }
      }
    });

    // Retry Strategy
    this.recoveryStrategies.set('retry', {
      id: 'retry',
      name: 'Automatic Retry',
      priority: 70,
      canRecover: (error) => error.retryable && this.preferences.autoRetry,
      recover: async (error) => {
        const context = this.getRecoveryContext(error.serviceId);
        
        if (context.retryAttempts >= this.preferences.maxRetries) {
          return { success: false, message: 'Max retries exceeded' };
        }

        // Wait for retry delay
        const delay = this.calculateRetryDelay(context.retryAttempts);
        await new Promise(resolve => setTimeout(resolve, delay));

        return {
          success: true,
          message: `Retrying operation (attempt ${context.retryAttempts + 1})`
        };
      }
    });

    // Graceful Degradation Strategy
    this.recoveryStrategies.set('graceful-degradation', {
      id: 'graceful-degradation',
      name: 'Graceful Degradation',
      priority: 60,
      canRecover: () => true, // Always applicable as last resort
      recover: async (error) => {
        // Provide basic functionality without the failed service
        return {
          success: true,
          message: 'Switched to basic functionality mode',
          fallbackUsed: true,
          data: { degradedMode: true }
        };
      }
    });

    // Cache Recovery Strategy
    this.recoveryStrategies.set('cache-recovery', {
      id: 'cache-recovery',
      name: 'Cache Recovery',
      priority: 85,
      canRecover: (error) => error.context?.hasCachedData === true,
      recover: async (error) => {
        try {
          const cachedData = error.context?.cachedData;
          if (cachedData) {
            return {
              success: true,
              message: 'Using cached data',
              fallbackUsed: true,
              data: cachedData
            };
          }

          return { success: false, message: 'No cached data available' };
        } catch (cacheError) {
          return { 
            success: false, 
            message: `Cache recovery failed: ${cacheError.message}` 
          };
        }
      }
    });
  }

  private async tryOfflineMode(error: ServiceError): Promise<{ success: boolean; data?: any }> {
    try {
      // Check if the service supports offline mode
      const offlineCapable = ['canvas-manager', 'layer-manager', 'code-editor', 'document-editor'];
      
      if (offlineCapable.includes(error.serviceId)) {
        // Switch to offline processing
        return {
          success: true,
          data: { offlineMode: true, serviceId: error.serviceId }
        };
      }

      return { success: false };
    } catch (offlineError) {
      return { success: false };
    }
  }

  // Public API methods
  setPreferences(preferences: Partial<RecoveryPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  getPreferences(): RecoveryPreferences {
    return { ...this.preferences };
  }

  getRecoveryHistory(serviceId: string): ServiceError[] {
    const context = this.recoveryContext.get(serviceId);
    return context ? [...context.errorHistory] : [];
  }

  clearRecoveryHistory(serviceId?: string): void {
    if (serviceId) {
      this.recoveryContext.delete(serviceId);
    } else {
      this.recoveryContext.clear();
    }
  }

  getServiceHealth(): Record<string, 'healthy' | 'degraded' | 'recovering' | 'failed'> {
    const health: Record<string, 'healthy' | 'degraded' | 'recovering' | 'failed'> = {};

    for (const [serviceId, context] of this.recoveryContext.entries()) {
      const recentErrors = context.errorHistory.filter(
        error => Date.now() - error.timestamp < 300000 // Last 5 minutes
      );

      if (recentErrors.length === 0) {
        health[serviceId] = 'healthy';
      } else if (context.retryAttempts > 0 && context.retryAttempts < this.preferences.maxRetries) {
        health[serviceId] = 'recovering';
      } else if (recentErrors.length < 3) {
        health[serviceId] = 'degraded';
      } else {
        health[serviceId] = 'failed';
      }
    }

    return health;
  }

  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.id, strategy);
  }

  removeRecoveryStrategy(strategyId: string): void {
    this.recoveryStrategies.delete(strategyId);
  }

  getRecoveryStrategies(): RecoveryStrategy[] {
    return Array.from(this.recoveryStrategies.values());
  }
}