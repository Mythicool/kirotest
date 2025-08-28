import { FileReference } from '../models/FileReference';
import { DataTransformer, ConversionResult } from './DataTransformer';
import { StreamingFileProcessor, StreamingResult } from './StreamingFileProcessor';
import { FileValidator, SecurityScanResult, SanitizationResult } from './FileValidator';
import { FileConversionOptions, FileProcessingStatus } from '../types/file';
import { UUID } from '../types/common';

export interface BatchOperation {
  id: UUID;
  type: BatchOperationType;
  files: FileReference[];
  options: any;
  status: BatchOperationStatus;
  progress: BatchProgress;
  results: BatchOperationResult[];
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export enum BatchOperationType {
  CONVERT = 'convert',
  VALIDATE = 'validate',
  SANITIZE = 'sanitize',
  COMPRESS = 'compress',
  SCAN_SECURITY = 'scan_security',
  EXTRACT_METADATA = 'extract_metadata',
  GENERATE_THUMBNAILS = 'generate_thumbnails',
  CUSTOM = 'custom'
}

export enum BatchOperationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface BatchProgress {
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  currentFile?: string;
  overallProgress: number; // 0-100
  estimatedTimeRemaining?: number;
  throughput?: number; // files per second
}

export interface BatchOperationResult {
  fileId: UUID;
  fileName: string;
  success: boolean;
  result?: any;
  error?: string;
  processingTime: number;
  warnings?: string[];
}

export interface BatchProcessingOptions {
  maxConcurrency?: number;
  continueOnError?: boolean;
  retryFailedOperations?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (progress: BatchProgress) => void;
  onFileComplete?: (result: BatchOperationResult) => void;
  onOperationComplete?: (operation: BatchOperation) => void;
}

export interface BatchConversionOptions extends BatchProcessingOptions {
  targetFormat: string;
  conversionOptions?: FileConversionOptions;
}

export interface BatchValidationOptions extends BatchProcessingOptions {
  strictMode?: boolean;
  customRules?: any[];
}

export interface BatchSanitizationOptions extends BatchProcessingOptions {
  sanitizationOptions?: any;
}

export class BatchProcessor {
  private static instance: BatchProcessor;
  private activeOperations = new Map<UUID, BatchOperation>();
  private abortControllers = new Map<UUID, AbortController>();
  
  private dataTransformer: DataTransformer;
  private streamingProcessor: StreamingFileProcessor;
  private fileValidator: FileValidator;

  private constructor() {
    this.dataTransformer = DataTransformer.getInstance();
    this.streamingProcessor = StreamingFileProcessor.getInstance();
    this.fileValidator = FileValidator.getInstance();
  }

  static getInstance(): BatchProcessor {
    if (!BatchProcessor.instance) {
      BatchProcessor.instance = new BatchProcessor();
    }
    return BatchProcessor.instance;
  }

  /**
   * Convert multiple files to a target format
   */
  async convertFiles(
    files: FileReference[],
    options: BatchConversionOptions
  ): Promise<BatchOperation> {
    const operation = this.createBatchOperation(
      BatchOperationType.CONVERT,
      files,
      options
    );

    this.executeOperation(operation, async (file, index) => {
      const startTime = Date.now();
      
      try {
        const result = await this.dataTransformer.convertFile(
          file,
          options.targetFormat,
          options.conversionOptions
        );
        
        return {
          fileId: file.id,
          fileName: file.name,
          success: result.success,
          result: result,
          processingTime: Date.now() - startTime,
          error: result.error,
          warnings: result.warnings
        };
      } catch (error) {
        return {
          fileId: file.id,
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        };
      }
    }, options);

    return operation;
  }

  /**
   * Validate multiple files
   */
  async validateFiles(
    files: FileReference[],
    options: BatchValidationOptions = {}
  ): Promise<BatchOperation> {
    const operation = this.createBatchOperation(
      BatchOperationType.VALIDATE,
      files,
      options
    );

    this.executeOperation(operation, async (file, index) => {
      const startTime = Date.now();
      
      try {
        const result = await this.fileValidator.validateFile(file, options.customRules);
        
        return {
          fileId: file.id,
          fileName: file.name,
          success: result.isValid,
          result: result,
          processingTime: Date.now() - startTime,
          warnings: result.warnings
        };
      } catch (error) {
        return {
          fileId: file.id,
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        };
      }
    }, options);

    return operation;
  }

  /**
   * Perform security scans on multiple files
   */
  async scanFiles(
    files: FileReference[],
    options: BatchProcessingOptions = {}
  ): Promise<BatchOperation> {
    const operation = this.createBatchOperation(
      BatchOperationType.SCAN_SECURITY,
      files,
      options
    );

    this.executeOperation(operation, async (file, index) => {
      const startTime = Date.now();
      
      try {
        const result = await this.fileValidator.scanForThreats(file);
        
        return {
          fileId: file.id,
          fileName: file.name,
          success: result.isSafe,
          result: result,
          processingTime: Date.now() - startTime,
          warnings: result.warnings
        };
      } catch (error) {
        return {
          fileId: file.id,
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        };
      }
    }, options);

    return operation;
  }

  /**
   * Sanitize multiple files
   */
  async sanitizeFiles(
    files: FileReference[],
    options: BatchSanitizationOptions = {}
  ): Promise<BatchOperation> {
    const operation = this.createBatchOperation(
      BatchOperationType.SANITIZE,
      files,
      options
    );

    this.executeOperation(operation, async (file, index) => {
      const startTime = Date.now();
      
      try {
        const result = await this.fileValidator.sanitizeFile(file, options.sanitizationOptions);
        
        return {
          fileId: file.id,
          fileName: file.name,
          success: result.success,
          result: result,
          processingTime: Date.now() - startTime,
          warnings: result.warnings
        };
      } catch (error) {
        return {
          fileId: file.id,
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        };
      }
    }, options);

    return operation;
  }

  /**
   * Generate thumbnails for multiple files
   */
  async generateThumbnails(
    files: FileReference[],
    options: BatchProcessingOptions & { 
      thumbnailSize?: { width: number; height: number };
      quality?: number;
    } = {}
  ): Promise<BatchOperation> {
    const operation = this.createBatchOperation(
      BatchOperationType.GENERATE_THUMBNAILS,
      files,
      options
    );

    this.executeOperation(operation, async (file, index) => {
      const startTime = Date.now();
      
      try {
        if (!file.isImage()) {
          return {
            fileId: file.id,
            fileName: file.name,
            success: false,
            error: 'File is not an image',
            processingTime: Date.now() - startTime
          };
        }

        const thumbnailResult = await this.generateThumbnail(file, options);
        
        return {
          fileId: file.id,
          fileName: file.name,
          success: thumbnailResult.success,
          result: thumbnailResult,
          processingTime: Date.now() - startTime,
          error: thumbnailResult.error
        };
      } catch (error) {
        return {
          fileId: file.id,
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        };
      }
    }, options);

    return operation;
  }

  /**
   * Execute custom batch operation
   */
  async executeCustomBatch<T>(
    files: FileReference[],
    processor: (file: FileReference, index: number) => Promise<T>,
    options: BatchProcessingOptions = {}
  ): Promise<BatchOperation> {
    const operation = this.createBatchOperation(
      BatchOperationType.CUSTOM,
      files,
      options
    );

    this.executeOperation(operation, async (file, index) => {
      const startTime = Date.now();
      
      try {
        const result = await processor(file, index);
        
        return {
          fileId: file.id,
          fileName: file.name,
          success: true,
          result: result,
          processingTime: Date.now() - startTime
        };
      } catch (error) {
        return {
          fileId: file.id,
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        };
      }
    }, options);

    return operation;
  }

  /**
   * Pause a running batch operation
   */
  pauseOperation(operationId: UUID): boolean {
    const operation = this.activeOperations.get(operationId);
    if (operation && operation.status === BatchOperationStatus.RUNNING) {
      operation.status = BatchOperationStatus.PAUSED;
      return true;
    }
    return false;
  }

  /**
   * Resume a paused batch operation
   */
  resumeOperation(operationId: UUID): boolean {
    const operation = this.activeOperations.get(operationId);
    if (operation && operation.status === BatchOperationStatus.PAUSED) {
      operation.status = BatchOperationStatus.RUNNING;
      // Resume processing would be implemented here
      return true;
    }
    return false;
  }

  /**
   * Cancel a batch operation
   */
  cancelOperation(operationId: UUID): boolean {
    const operation = this.activeOperations.get(operationId);
    const controller = this.abortControllers.get(operationId);
    
    if (operation && controller) {
      operation.status = BatchOperationStatus.CANCELLED;
      controller.abort();
      return true;
    }
    return false;
  }

  /**
   * Get operation status
   */
  getOperation(operationId: UUID): BatchOperation | null {
    return this.activeOperations.get(operationId) || null;
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): BatchOperation[] {
    return Array.from(this.activeOperations.values());
  }

  /**
   * Get operation statistics
   */
  getOperationStats(operationId: UUID): {
    totalFiles: number;
    completedFiles: number;
    failedFiles: number;
    successRate: number;
    averageProcessingTime: number;
    totalProcessingTime: number;
  } | null {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return null;

    const completedFiles = operation.results.length;
    const failedFiles = operation.results.filter(r => !r.success).length;
    const successfulFiles = completedFiles - failedFiles;
    const totalProcessingTime = operation.results.reduce((sum, r) => sum + r.processingTime, 0);

    return {
      totalFiles: operation.files.length,
      completedFiles,
      failedFiles,
      successRate: completedFiles > 0 ? (successfulFiles / completedFiles) * 100 : 0,
      averageProcessingTime: completedFiles > 0 ? totalProcessingTime / completedFiles : 0,
      totalProcessingTime
    };
  }

  private createBatchOperation(
    type: BatchOperationType,
    files: FileReference[],
    options: any
  ): BatchOperation {
    const operation: BatchOperation = {
      id: this.generateOperationId(),
      type,
      files,
      options,
      status: BatchOperationStatus.PENDING,
      progress: {
        totalFiles: files.length,
        processedFiles: 0,
        failedFiles: 0,
        overallProgress: 0
      },
      results: [],
      startTime: new Date()
    };

    this.activeOperations.set(operation.id, operation);
    return operation;
  }

  private async executeOperation(
    operation: BatchOperation,
    processor: (file: FileReference, index: number) => Promise<BatchOperationResult>,
    options: BatchProcessingOptions
  ): Promise<void> {
    const abortController = new AbortController();
    this.abortControllers.set(operation.id, abortController);

    operation.status = BatchOperationStatus.RUNNING;
    const startTime = Date.now();

    try {
      const maxConcurrency = options.maxConcurrency || 3;
      const semaphore = new Semaphore(maxConcurrency);
      const processingPromises: Promise<void>[] = [];

      for (let i = 0; i < operation.files.length; i++) {
        const file = operation.files[i];
        
        const processingPromise = semaphore.acquire().then(async (release) => {
          try {
            if (abortController.signal.aborted) {
              return;
            }

            // Update current file
            operation.progress.currentFile = file.name;
            this.reportProgress(operation, options.onProgress);

            // Process file with retry logic
            let result: BatchOperationResult;
            let attempts = 0;
            const maxRetries = options.retryFailedOperations ? (options.maxRetries || 3) : 1;

            do {
              attempts++;
              result = await processor(file, i);
              
              if (!result.success && attempts < maxRetries) {
                // Wait before retry
                const delay = options.retryDelay || 1000;
                await new Promise(resolve => setTimeout(resolve, delay * attempts));
              }
            } while (!result.success && attempts < maxRetries);

            // Update operation results
            operation.results.push(result);
            operation.progress.processedFiles++;
            
            if (!result.success) {
              operation.progress.failedFiles++;
              
              if (!options.continueOnError) {
                abortController.abort();
                operation.status = BatchOperationStatus.FAILED;
                operation.error = `Processing failed for file: ${file.name}`;
                return;
              }
            }

            // Update progress
            operation.progress.overallProgress = Math.round(
              (operation.progress.processedFiles / operation.progress.totalFiles) * 100
            );

            // Calculate throughput and ETA
            const elapsed = Date.now() - startTime;
            operation.progress.throughput = operation.progress.processedFiles / (elapsed / 1000);
            
            if (operation.progress.throughput > 0) {
              const remainingFiles = operation.progress.totalFiles - operation.progress.processedFiles;
              operation.progress.estimatedTimeRemaining = remainingFiles / operation.progress.throughput;
            }

            this.reportProgress(operation, options.onProgress);
            
            if (options.onFileComplete) {
              options.onFileComplete(result);
            }

          } finally {
            release();
          }
        });

        processingPromises.push(processingPromise);
      }

      // Wait for all files to be processed
      await Promise.all(processingPromises);

      if (operation.status === BatchOperationStatus.RUNNING) {
        operation.status = BatchOperationStatus.COMPLETED;
      }

    } catch (error) {
      operation.status = BatchOperationStatus.FAILED;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      operation.endTime = new Date();
      this.abortControllers.delete(operation.id);
      
      if (options.onOperationComplete) {
        options.onOperationComplete(operation);
      }
    }
  }

  private async generateThumbnail(
    file: FileReference,
    options: { thumbnailSize?: { width: number; height: number }; quality?: number }
  ): Promise<{ success: boolean; thumbnailUrl?: string; error?: string }> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const size = options.thumbnailSize || { width: 150, height: 150 };

      img.onload = () => {
        try {
          // Calculate aspect ratio
          const aspectRatio = img.width / img.height;
          let { width, height } = size;

          if (aspectRatio > 1) {
            height = width / aspectRatio;
          } else {
            width = height * aspectRatio;
          }

          canvas.width = width;
          canvas.height = height;

          if (!ctx) {
            resolve({ success: false, error: 'Canvas context not available' });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve({ success: false, error: 'Failed to generate thumbnail' });
              return;
            }

            const thumbnailUrl = URL.createObjectURL(blob);
            resolve({ success: true, thumbnailUrl });
          }, 'image/jpeg', options.quality || 0.8);

        } catch (error) {
          resolve({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      };

      img.onerror = () => {
        resolve({ success: false, error: 'Failed to load image' });
      };

      img.src = file.url;
    });
  }

  private reportProgress(
    operation: BatchOperation,
    onProgress?: (progress: BatchProgress) => void
  ): void {
    if (onProgress) {
      onProgress({ ...operation.progress });
    }
  }

  private generateOperationId(): UUID {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Simple semaphore implementation for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.waitQueue.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }

  private release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      if (next) {
        next();
      }
    }
  }
}