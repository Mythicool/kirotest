import { UUID } from '../types/common';

export interface ProgressInfo {
  operationId: UUID;
  operationType: string;
  status: OperationStatus;
  progress: number; // 0-100
  stage: string;
  message?: string;
  startTime: Date;
  lastUpdate: Date;
  estimatedTimeRemaining?: number;
  throughput?: number;
  metadata?: Record<string, any>;
}

export enum OperationStatus {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ProgressCallback {
  (progress: ProgressInfo): void;
}

export interface CancellationToken {
  isCancelled: boolean;
  onCancelled: (callback: () => void) => void;
  throwIfCancelled(): void;
}

export interface OperationOptions {
  onProgress?: ProgressCallback;
  cancellationToken?: CancellationToken;
  timeout?: number;
  metadata?: Record<string, any>;
}

export class ProgressTracker {
  private static instance: ProgressTracker;
  private operations = new Map<UUID, ProgressInfo>();
  private callbacks = new Map<UUID, Set<ProgressCallback>>();
  private cancellationTokens = new Map<UUID, CancellationTokenImpl>();
  private timeouts = new Map<UUID, NodeJS.Timeout>();

  private constructor() {}

  static getInstance(): ProgressTracker {
    if (!ProgressTracker.instance) {
      ProgressTracker.instance = new ProgressTracker();
    }
    return ProgressTracker.instance;
  }

  /**
   * Start tracking a new operation
   */
  startOperation(
    operationId: UUID,
    operationType: string,
    options: OperationOptions = {}
  ): CancellationToken {
    const now = new Date();
    
    const progressInfo: ProgressInfo = {
      operationId,
      operationType,
      status: OperationStatus.PENDING,
      progress: 0,
      stage: 'Initializing',
      startTime: now,
      lastUpdate: now,
      metadata: options.metadata || {}
    };

    this.operations.set(operationId, progressInfo);

    // Set up progress callback
    if (options.onProgress) {
      this.addProgressCallback(operationId, options.onProgress);
    }

    // Create cancellation token
    const cancellationToken = new CancellationTokenImpl();
    this.cancellationTokens.set(operationId, cancellationToken);

    // Set up timeout if specified
    if (options.timeout) {
      const timeoutId = setTimeout(() => {
        this.cancelOperation(operationId, 'Operation timed out');
      }, options.timeout);
      this.timeouts.set(operationId, timeoutId);
    }

    // Initial progress report
    this.reportProgress(operationId, 0, 'Operation started');

    return cancellationToken;
  }

  /**
   * Update operation progress
   */
  updateProgress(
    operationId: UUID,
    progress: number,
    stage?: string,
    message?: string,
    metadata?: Record<string, any>
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    const now = new Date();
    const previousProgress = operation.progress;
    
    // Update progress info
    operation.progress = Math.max(0, Math.min(100, progress));
    operation.lastUpdate = now;
    operation.status = progress >= 100 ? OperationStatus.COMPLETED : OperationStatus.RUNNING;
    
    if (stage) operation.stage = stage;
    if (message) operation.message = message;
    if (metadata) {
      operation.metadata = { ...operation.metadata, ...metadata };
    }

    // Calculate throughput and ETA
    this.calculateMetrics(operation, previousProgress);

    // Report progress to callbacks
    this.notifyCallbacks(operationId, operation);

    // Clean up if completed
    if (operation.status === OperationStatus.COMPLETED) {
      this.completeOperation(operationId);
    }
  }

  /**
   * Report progress with automatic stage detection
   */
  reportProgress(
    operationId: UUID,
    progress: number,
    stage: string,
    message?: string
  ): void {
    this.updateProgress(operationId, progress, stage, message);
  }

  /**
   * Mark operation as failed
   */
  failOperation(operationId: UUID, error: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    operation.status = OperationStatus.FAILED;
    operation.message = error;
    operation.lastUpdate = new Date();

    this.notifyCallbacks(operationId, operation);
    this.cleanupOperation(operationId);
  }

  /**
   * Cancel an operation
   */
  cancelOperation(operationId: UUID, reason?: string): boolean {
    const operation = this.operations.get(operationId);
    const cancellationToken = this.cancellationTokens.get(operationId);

    if (!operation || !cancellationToken) return false;

    operation.status = OperationStatus.CANCELLED;
    operation.message = reason || 'Operation cancelled';
    operation.lastUpdate = new Date();

    // Trigger cancellation
    cancellationToken.cancel();

    this.notifyCallbacks(operationId, operation);
    this.cleanupOperation(operationId);

    return true;
  }

  /**
   * Pause an operation
   */
  pauseOperation(operationId: UUID): boolean {
    const operation = this.operations.get(operationId);
    if (!operation || operation.status !== OperationStatus.RUNNING) return false;

    operation.status = OperationStatus.PAUSED;
    operation.lastUpdate = new Date();

    this.notifyCallbacks(operationId, operation);
    return true;
  }

  /**
   * Resume a paused operation
   */
  resumeOperation(operationId: UUID): boolean {
    const operation = this.operations.get(operationId);
    if (!operation || operation.status !== OperationStatus.PAUSED) return false;

    operation.status = OperationStatus.RUNNING;
    operation.lastUpdate = new Date();

    this.notifyCallbacks(operationId, operation);
    return true;
  }

  /**
   * Get operation progress
   */
  getProgress(operationId: UUID): ProgressInfo | null {
    return this.operations.get(operationId) || null;
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): ProgressInfo[] {
    return Array.from(this.operations.values()).filter(op => 
      op.status === OperationStatus.RUNNING || 
      op.status === OperationStatus.PAUSED ||
      op.status === OperationStatus.INITIALIZING
    );
  }

  /**
   * Get all operations
   */
  getAllOperations(): ProgressInfo[] {
    return Array.from(this.operations.values());
  }

  /**
   * Add progress callback for an operation
   */
  addProgressCallback(operationId: UUID, callback: ProgressCallback): void {
    if (!this.callbacks.has(operationId)) {
      this.callbacks.set(operationId, new Set());
    }
    this.callbacks.get(operationId)!.add(callback);
  }

  /**
   * Remove progress callback for an operation
   */
  removeProgressCallback(operationId: UUID, callback: ProgressCallback): void {
    const callbacks = this.callbacks.get(operationId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.callbacks.delete(operationId);
      }
    }
  }

  /**
   * Create a cancellation token
   */
  createCancellationToken(): CancellationToken {
    return new CancellationTokenImpl();
  }

  /**
   * Check if operation is cancelled
   */
  isCancelled(operationId: UUID): boolean {
    const token = this.cancellationTokens.get(operationId);
    return token ? token.isCancelled : false;
  }

  /**
   * Clean up completed or failed operations
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours default
    const now = Date.now();
    const operationsToRemove: UUID[] = [];

    for (const [operationId, operation] of this.operations.entries()) {
      const age = now - operation.lastUpdate.getTime();
      
      if (age > maxAge && (
        operation.status === OperationStatus.COMPLETED ||
        operation.status === OperationStatus.FAILED ||
        operation.status === OperationStatus.CANCELLED
      )) {
        operationsToRemove.push(operationId);
      }
    }

    operationsToRemove.forEach(operationId => {
      this.cleanupOperation(operationId);
    });
  }

  /**
   * Get operation statistics
   */
  getStatistics(): {
    total: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
    averageCompletionTime: number;
  } {
    const operations = Array.from(this.operations.values());
    const completed = operations.filter(op => op.status === OperationStatus.COMPLETED);
    
    const averageCompletionTime = completed.length > 0 
      ? completed.reduce((sum, op) => {
          const duration = op.lastUpdate.getTime() - op.startTime.getTime();
          return sum + duration;
        }, 0) / completed.length
      : 0;

    return {
      total: operations.length,
      active: operations.filter(op => 
        op.status === OperationStatus.RUNNING || 
        op.status === OperationStatus.PAUSED ||
        op.status === OperationStatus.INITIALIZING
      ).length,
      completed: completed.length,
      failed: operations.filter(op => op.status === OperationStatus.FAILED).length,
      cancelled: operations.filter(op => op.status === OperationStatus.CANCELLED).length,
      averageCompletionTime
    };
  }

  private completeOperation(operationId: UUID): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.progress = 100;
      operation.status = OperationStatus.COMPLETED;
      operation.stage = 'Completed';
      operation.lastUpdate = new Date();
      
      this.notifyCallbacks(operationId, operation);
    }
    
    // Don't cleanup immediately - let the cleanup method handle it
  }

  private cleanupOperation(operationId: UUID): void {
    // Clear timeout
    const timeoutId = this.timeouts.get(operationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(operationId);
    }

    // Remove callbacks
    this.callbacks.delete(operationId);

    // Remove cancellation token
    this.cancellationTokens.delete(operationId);

    // Keep operation info for history (will be cleaned up by cleanup method)
  }

  private calculateMetrics(operation: ProgressInfo, previousProgress: number): void {
    const now = operation.lastUpdate.getTime();
    const start = operation.startTime.getTime();
    const elapsed = now - start;

    if (elapsed > 0) {
      // Calculate throughput (progress per second)
      operation.throughput = operation.progress / (elapsed / 1000);

      // Estimate remaining time
      if (operation.throughput > 0 && operation.progress > 0) {
        const remainingProgress = 100 - operation.progress;
        operation.estimatedTimeRemaining = remainingProgress / operation.throughput;
      }
    }
  }

  private notifyCallbacks(operationId: UUID, operation: ProgressInfo): void {
    const callbacks = this.callbacks.get(operationId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback({ ...operation });
        } catch (error) {
          console.error('Error in progress callback:', error);
        }
      });
    }
  }
}

/**
 * Implementation of cancellation token
 */
class CancellationTokenImpl implements CancellationToken {
  private _isCancelled = false;
  private _callbacks: Array<() => void> = [];

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  onCancelled(callback: () => void): void {
    if (this._isCancelled) {
      callback();
    } else {
      this._callbacks.push(callback);
    }
  }

  throwIfCancelled(): void {
    if (this._isCancelled) {
      throw new Error('Operation was cancelled');
    }
  }

  cancel(): void {
    if (!this._isCancelled) {
      this._isCancelled = true;
      this._callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in cancellation callback:', error);
        }
      });
      this._callbacks = [];
    }
  }
}

/**
 * Utility function to create a progress tracker for async operations
 */
export async function trackProgress<T>(
  operationId: UUID,
  operationType: string,
  operation: (
    updateProgress: (progress: number, stage?: string, message?: string) => void,
    cancellationToken: CancellationToken
  ) => Promise<T>,
  options: OperationOptions = {}
): Promise<T> {
  const tracker = ProgressTracker.getInstance();
  const cancellationToken = tracker.startOperation(operationId, operationType, options);

  try {
    const updateProgress = (progress: number, stage?: string, message?: string) => {
      tracker.updateProgress(operationId, progress, stage, message);
    };

    const result = await operation(updateProgress, cancellationToken);
    tracker.updateProgress(operationId, 100, 'Completed');
    return result;

  } catch (error) {
    if (cancellationToken.isCancelled) {
      tracker.cancelOperation(operationId, 'Operation was cancelled');
    } else {
      tracker.failOperation(operationId, error instanceof Error ? error.message : 'Unknown error');
    }
    throw error;
  }
}

/**
 * Utility function to generate operation IDs
 */
export function generateOperationId(prefix: string = 'op'): UUID {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}