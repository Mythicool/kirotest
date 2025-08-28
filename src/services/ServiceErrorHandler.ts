import { RetryLogic } from './RetryLogic';

export interface ServiceError {
  type: 'NETWORK_ERROR' | 'SERVICE_UNAVAILABLE' | 'RATE_LIMITED' | 'TIMEOUT' | 'VALIDATION_ERROR' | 'UNKNOWN';
  serviceId: string;
  message: string;
  code?: string;
  timestamp: number;
  retryable: boolean;
  context?: Record<string, any>;
}

export interface ErrorResolution {
  action: 'RETRY' | 'RETRY_WITH_ALTERNATIVE' | 'SWITCH_TO_OFFLINE' | 'QUEUE_FOR_RETRY' | 'SHOW_ERROR' | 'FALLBACK';
  alternatives?: string[];
  retryAfter?: number;
  message?: string;
  fallbackData?: any;
}

export interface ServiceAlternative {
  serviceId: string;
  name: string;
  capabilities: string[];
  priority: number;
}

export class ServiceErrorHandler {
  private retryLogic: RetryLogic;
  private serviceAlternatives: Map<string, ServiceAlternative[]>;
  private offlineCapabilities: Set<string>;
  private errorHistory: ServiceError[];

  constructor() {
    this.retryLogic = new RetryLogic();
    this.serviceAlternatives = new Map();
    this.offlineCapabilities = new Set();
    this.errorHistory = [];
    this.initializeServiceAlternatives();
    this.initializeOfflineCapabilities();
  }

  async handleServiceError(error: ServiceError): Promise<ErrorResolution> {
    this.logError(error);
    
    switch (error.type) {
      case 'NETWORK_ERROR':
        return this.handleNetworkError(error);
      case 'SERVICE_UNAVAILABLE':
        return this.handleServiceUnavailable(error);
      case 'RATE_LIMITED':
        return this.handleRateLimit(error);
      case 'TIMEOUT':
        return this.handleTimeout(error);
      case 'VALIDATION_ERROR':
        return this.handleValidationError(error);
      default:
        return this.handleGenericError(error);
    }
  }

  private async handleNetworkError(error: ServiceError): Promise<ErrorResolution> {
    // Check if we're offline
    if (!navigator.onLine) {
      if (this.hasOfflineCapability(error.serviceId)) {
        return {
          action: 'SWITCH_TO_OFFLINE',
          message: 'Working offline - some features may be limited'
        };
      }
      return {
        action: 'QUEUE_FOR_RETRY',
        retryAfter: 5000,
        message: 'No internet connection. Will retry when connection is restored.'
      };
    }

    // Try alternative services first
    const alternatives = this.findAlternativeServices(error.serviceId);
    if (alternatives.length > 0) {
      return {
        action: 'RETRY_WITH_ALTERNATIVE',
        alternatives: alternatives.map(alt => alt.serviceId),
        message: 'Trying alternative service...'
      };
    }

    // Queue for retry with exponential backoff
    const retryDelay = this.retryLogic.getNextDelay(error.serviceId);
    return {
      action: 'QUEUE_FOR_RETRY',
      retryAfter: retryDelay,
      message: `Network error. Retrying in ${Math.round(retryDelay / 1000)} seconds...`
    };
  }

  private async handleServiceUnavailable(error: ServiceError): Promise<ErrorResolution> {
    // Try alternative services
    const alternatives = this.findAlternativeServices(error.serviceId);
    if (alternatives.length > 0) {
      return {
        action: 'RETRY_WITH_ALTERNATIVE',
        alternatives: alternatives.map(alt => alt.serviceId),
        message: 'Service unavailable. Trying alternative...'
      };
    }

    // Offer offline mode if available
    if (this.hasOfflineCapability(error.serviceId)) {
      return {
        action: 'SWITCH_TO_OFFLINE',
        message: 'Service unavailable. Working offline with limited features.'
      };
    }

    // Queue for later retry
    return {
      action: 'QUEUE_FOR_RETRY',
      retryAfter: 300000, // 5 minutes
      message: 'Service temporarily unavailable. Will retry automatically.'
    };
  }

  private async handleRateLimit(error: ServiceError): Promise<ErrorResolution> {
    // Extract retry-after from error context if available
    const retryAfter = error.context?.retryAfter || 60000; // Default 1 minute

    // Try alternative services that might not be rate limited
    const alternatives = this.findAlternativeServices(error.serviceId);
    if (alternatives.length > 0) {
      return {
        action: 'RETRY_WITH_ALTERNATIVE',
        alternatives: alternatives.map(alt => alt.serviceId),
        message: 'Rate limit reached. Trying alternative service...'
      };
    }

    return {
      action: 'QUEUE_FOR_RETRY',
      retryAfter,
      message: `Rate limit reached. Retrying in ${Math.round(retryAfter / 1000)} seconds...`
    };
  }

  private async handleTimeout(error: ServiceError): Promise<ErrorResolution> {
    // For timeouts, try alternatives first as the service might be slow
    const alternatives = this.findAlternativeServices(error.serviceId);
    if (alternatives.length > 0) {
      return {
        action: 'RETRY_WITH_ALTERNATIVE',
        alternatives: alternatives.map(alt => alt.serviceId),
        message: 'Service timeout. Trying faster alternative...'
      };
    }

    // Retry with exponential backoff
    const retryDelay = this.retryLogic.getNextDelay(error.serviceId);
    return {
      action: 'QUEUE_FOR_RETRY',
      retryAfter: retryDelay,
      message: `Request timeout. Retrying in ${Math.round(retryDelay / 1000)} seconds...`
    };
  }

  private async handleValidationError(error: ServiceError): Promise<ErrorResolution> {
    // Validation errors are usually not retryable
    return {
      action: 'SHOW_ERROR',
      message: `Invalid data: ${error.message}. Please check your input and try again.`
    };
  }

  private async handleGenericError(error: ServiceError): Promise<ErrorResolution> {
    if (error.retryable) {
      const retryDelay = this.retryLogic.getNextDelay(error.serviceId);
      return {
        action: 'QUEUE_FOR_RETRY',
        retryAfter: retryDelay,
        message: `An error occurred. Retrying in ${Math.round(retryDelay / 1000)} seconds...`
      };
    }

    return {
      action: 'SHOW_ERROR',
      message: error.message || 'An unexpected error occurred. Please try again.'
    };
  }

  private findAlternativeServices(serviceId: string): ServiceAlternative[] {
    return this.serviceAlternatives.get(serviceId) || [];
  }

  private hasOfflineCapability(serviceId: string): boolean {
    return this.offlineCapabilities.has(serviceId);
  }

  private logError(error: ServiceError): void {
    this.errorHistory.push(error);
    
    // Keep only last 100 errors to prevent memory leaks
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }

    console.error('Service Error:', error);
  }

  private initializeServiceAlternatives(): void {
    // Creative Studio alternatives
    this.serviceAlternatives.set('photopea', [
      { serviceId: 'pixlr', name: 'Pixlr Editor', capabilities: ['image-editing'], priority: 1 }
    ]);
    
    this.serviceAlternatives.set('svg-edit', [
      { serviceId: 'method-draw', name: 'Method Draw', capabilities: ['vector-editing'], priority: 1 }
    ]);

    // Developer Hub alternatives
    this.serviceAlternatives.set('replit', [
      { serviceId: 'codepen', name: 'CodePen', capabilities: ['code-execution'], priority: 1 },
      { serviceId: 'jsbin', name: 'JS Bin', capabilities: ['code-execution'], priority: 2 }
    ]);

    this.serviceAlternatives.set('gtmetrix', [
      { serviceId: 'pingdom', name: 'Pingdom', capabilities: ['performance-testing'], priority: 1 }
    ]);

    // Document Pipeline alternatives
    this.serviceAlternatives.set('cloud-convert', [
      { serviceId: 'pandoc', name: 'Pandoc Try', capabilities: ['document-conversion'], priority: 1 }
    ]);

    // Media Suite alternatives
    this.serviceAlternatives.set('twistedweb', [
      { serviceId: 'filelab-audio', name: 'Filelab Audio Editor', capabilities: ['audio-editing'], priority: 1 }
    ]);
  }

  private initializeOfflineCapabilities(): void {
    // Services that can work offline with limited functionality
    this.offlineCapabilities.add('canvas-manager');
    this.offlineCapabilities.add('layer-manager');
    this.offlineCapabilities.add('code-editor');
    this.offlineCapabilities.add('document-editor');
    this.offlineCapabilities.add('file-validator');
    this.offlineCapabilities.add('data-transformer');
  }

  getErrorHistory(): ServiceError[] {
    return [...this.errorHistory];
  }

  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  getServiceHealth(serviceId: string): 'healthy' | 'degraded' | 'unavailable' {
    const recentErrors = this.errorHistory
      .filter(error => error.serviceId === serviceId)
      .filter(error => Date.now() - error.timestamp < 300000); // Last 5 minutes

    if (recentErrors.length === 0) return 'healthy';
    if (recentErrors.length < 3) return 'degraded';
    return 'unavailable';
  }
}