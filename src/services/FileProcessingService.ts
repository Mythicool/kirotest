import { FileReference } from '../models/FileReference';
import { DataTransformer, ConversionResult } from './DataTransformer';
import { StreamingFileProcessor, StreamingResult, StreamingOptions } from './StreamingFileProcessor';
import { FileValidator, SecurityScanResult, SanitizationResult } from './FileValidator';
import { BatchProcessor, BatchOperation, BatchProcessingOptions } from './BatchProcessor';
import { ProgressTracker, ProgressInfo, CancellationToken, generateOperationId, trackProgress } from './ProgressTracker';
import { FileConversionOptions, FileProcessingStatus } from '../types/file';
import { UUID } from '../types/common';

export interface FileProcessingOptions {
  enableProgress?: boolean;
  enableCancellation?: boolean;
  timeout?: number;
  onProgress?: (progress: ProgressInfo) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export interface ProcessingResult<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  operationId: UUID;
  processingTime: number;
  warnings?: string[];
}

export class FileProcessingService {
  private static instance: FileProcessingService;
  
  private dataTransformer: DataTransformer;
  private streamingProcessor: StreamingFileProcessor;
  private fileValidator: FileValidator;
  private batchProcessor: BatchProcessor;
  private progressTracker: ProgressTracker;

  private constructor() {
    this.dataTransformer = DataTransformer.getInstance();
    this.streamingProcessor = StreamingFileProcessor.getInstance();
    this.fileValidator = FileValidator.getInstance();
    this.batchProcessor = BatchProcessor.getInstance();
    this.progressTracker = ProgressTracker.getInstance();
  }

  static getInstance(): FileProcessingService {
    if (!FileProcessingService.instance) {
      FileProcessingService.instance = new FileProcessingService();
    }
    return FileProcessingService.instance;
  }

  /**
   * Convert a single file with progress tracking
   */
  async convertFile(
    file: FileReference,
    targetFormat: string,
    conversionOptions: FileConversionOptions = {},
    processingOptions: FileProcessingOptions = {}
  ): Promise<ProcessingResult<ConversionResult>> {
    const operationId = generateOperationId('convert');
    const startTime = Date.now();

    if (!processingOptions.enableProgress) {
      // Simple conversion without progress tracking
      try {
        const result = await this.dataTransformer.convertFile(file, targetFormat, conversionOptions);
        return {
          success: result.success,
          result,
          error: result.error,
          operationId,
          processingTime: Date.now() - startTime,
          warnings: result.warnings
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          operationId,
          processingTime: Date.now() - startTime
        };
      }
    }

    // Conversion with progress tracking
    return trackProgress(
      operationId,
      'file_conversion',
      async (updateProgress, cancellationToken) => {
        updateProgress(10, 'Initializing conversion');

        const result = await this.dataTransformer.convertFile(
          file,
          targetFormat,
          conversionOptions,
          (progress) => {
            cancellationToken.throwIfCancelled();
            updateProgress(10 + (progress.progress * 0.8), progress.stage);
          }
        );

        updateProgress(95, 'Finalizing');
        
        if (processingOptions.onComplete) {
          processingOptions.onComplete(result);
        }

        return {
          success: result.success,
          result,
          error: result.error,
          operationId,
          processingTime: Date.now() - startTime,
          warnings: result.warnings
        };
      },
      {
        onProgress: processingOptions.onProgress,
        timeout: processingOptions.timeout
      }
    );
  }

  /**
   * Process a large file using streaming with progress tracking
   */
  async processLargeFile(
    file: FileReference,
    processor: (chunk: ArrayBuffer, chunkInfo: any) => Promise<ArrayBuffer | void>,
    streamingOptions: StreamingOptions = {},
    processingOptions: FileProcessingOptions = {}
  ): Promise<ProcessingResult<StreamingResult>> {
    const operationId = generateOperationId('stream');
    const startTime = Date.now();

    if (!processingOptions.enableProgress) {
      // Simple streaming without progress tracking
      try {
        const result = await this.streamingProcessor.processFile(file, processor, streamingOptions);
        return {
          success: result.success,
          result,
          error: result.error,
          operationId,
          processingTime: Date.now() - startTime
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          operationId,
          processingTime: Date.now() - startTime
        };
      }
    }

    // Streaming with progress tracking
    return trackProgress(
      operationId,
      'large_file_processing',
      async (updateProgress, cancellationToken) => {
        const enhancedOptions: StreamingOptions = {
          ...streamingOptions,
          onProgress: (progress) => {
            cancellationToken.throwIfCancelled();
            updateProgress(progress.progress, progress.stage);
          }
        };

        const result = await this.streamingProcessor.processFile(file, processor, enhancedOptions);
        
        if (processingOptions.onComplete) {
          processingOptions.onComplete(result);
        }

        return {
          success: result.success,
          result,
          error: result.error,
          operationId,
          processingTime: Date.now() - startTime
        };
      },
      {
        onProgress: processingOptions.onProgress,
        timeout: processingOptions.timeout
      }
    );
  }

  /**
   * Validate a file with security scanning
   */
  async validateFile(
    file: FileReference,
    customRules: any[] = [],
    processingOptions: FileProcessingOptions = {}
  ): Promise<ProcessingResult<{ validation: any; security: SecurityScanResult }>> {
    const operationId = generateOperationId('validate');
    const startTime = Date.now();

    if (!processingOptions.enableProgress) {
      // Simple validation without progress tracking
      try {
        const validation = await this.fileValidator.validateFile(file, customRules);
        const security = await this.fileValidator.scanForThreats(file);
        
        const result = { validation, security };
        return {
          success: validation.isValid && security.isSafe,
          result,
          operationId,
          processingTime: Date.now() - startTime,
          warnings: [...validation.warnings, ...security.warnings]
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          operationId,
          processingTime: Date.now() - startTime
        };
      }
    }

    // Validation with progress tracking
    return trackProgress(
      operationId,
      'file_validation',
      async (updateProgress, cancellationToken) => {
        updateProgress(20, 'Validating file structure');
        cancellationToken.throwIfCancelled();
        
        const validation = await this.fileValidator.validateFile(file, customRules);
        
        updateProgress(60, 'Scanning for security threats');
        cancellationToken.throwIfCancelled();
        
        const security = await this.fileValidator.scanForThreats(file);
        
        updateProgress(90, 'Finalizing validation');
        
        const result = { validation, security };
        
        if (processingOptions.onComplete) {
          processingOptions.onComplete(result);
        }

        return {
          success: validation.isValid && security.isSafe,
          result,
          operationId,
          processingTime: Date.now() - startTime,
          warnings: [...validation.warnings, ...security.warnings]
        };
      },
      {
        onProgress: processingOptions.onProgress,
        timeout: processingOptions.timeout
      }
    );
  }

  /**
   * Sanitize a file to remove potential threats
   */
  async sanitizeFile(
    file: FileReference,
    sanitizationOptions: any = {},
    processingOptions: FileProcessingOptions = {}
  ): Promise<ProcessingResult<SanitizationResult>> {
    const operationId = generateOperationId('sanitize');
    const startTime = Date.now();

    if (!processingOptions.enableProgress) {
      // Simple sanitization without progress tracking
      try {
        const result = await this.fileValidator.sanitizeFile(file, sanitizationOptions);
        return {
          success: result.success,
          result,
          error: result.error,
          operationId,
          processingTime: Date.now() - startTime,
          warnings: result.warnings
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          operationId,
          processingTime: Date.now() - startTime
        };
      }
    }

    // Sanitization with progress tracking
    return trackProgress(
      operationId,
      'file_sanitization',
      async (updateProgress, cancellationToken) => {
        updateProgress(20, 'Analyzing file content');
        cancellationToken.throwIfCancelled();
        
        updateProgress(50, 'Removing threats');
        const result = await this.fileValidator.sanitizeFile(file, sanitizationOptions);
        
        updateProgress(90, 'Finalizing sanitization');
        
        if (processingOptions.onComplete) {
          processingOptions.onComplete(result);
        }

        return {
          success: result.success,
          result,
          error: result.error,
          operationId,
          processingTime: Date.now() - startTime,
          warnings: result.warnings
        };
      },
      {
        onProgress: processingOptions.onProgress,
        timeout: processingOptions.timeout
      }
    );
  }

  /**
   * Process multiple files in batch
   */
  async processBatch(
    files: FileReference[],
    operation: 'convert' | 'validate' | 'sanitize' | 'scan',
    options: any = {},
    batchOptions: BatchProcessingOptions = {}
  ): Promise<BatchOperation> {
    switch (operation) {
      case 'convert':
        return this.batchProcessor.convertFiles(files, {
          targetFormat: options.targetFormat,
          conversionOptions: options.conversionOptions,
          ...batchOptions
        });
      
      case 'validate':
        return this.batchProcessor.validateFiles(files, {
          customRules: options.customRules,
          ...batchOptions
        });
      
      case 'sanitize':
        return this.batchProcessor.sanitizeFiles(files, {
          sanitizationOptions: options.sanitizationOptions,
          ...batchOptions
        });
      
      case 'scan':
        return this.batchProcessor.scanFiles(files, batchOptions);
      
      default:
        throw new Error(`Unsupported batch operation: ${operation}`);
    }
  }

  /**
   * Get processing capabilities for a file
   */
  getProcessingCapabilities(file: FileReference): {
    canConvert: boolean;
    supportedFormats: string[];
    canStream: boolean;
    canValidate: boolean;
    canSanitize: boolean;
    recommendations: string[];
  } {
    const conversionCapabilities = this.dataTransformer.getConversionCapabilities(file);
    
    return {
      canConvert: conversionCapabilities.supportedFormats.length > 0,
      supportedFormats: conversionCapabilities.supportedFormats,
      canStream: file.size > 10 * 1024 * 1024, // Files larger than 10MB benefit from streaming
      canValidate: true, // All files can be validated
      canSanitize: file.isDocument() || file.isCode() || file.type.includes('text'),
      recommendations: conversionCapabilities.recommendations
    };
  }

  /**
   * Cancel an operation
   */
  cancelOperation(operationId: UUID): boolean {
    // Try cancelling in progress tracker first
    if (this.progressTracker.cancelOperation(operationId)) {
      return true;
    }

    // Try cancelling in batch processor
    if (this.batchProcessor.cancelOperation(operationId)) {
      return true;
    }

    // Try cancelling in streaming processor
    if (this.streamingProcessor.cancelOperation(operationId)) {
      return true;
    }

    // Try cancelling in data transformer
    if (this.dataTransformer.cancelOperation(operationId)) {
      return true;
    }

    return false;
  }

  /**
   * Get operation progress
   */
  getOperationProgress(operationId: UUID): ProgressInfo | null {
    return this.progressTracker.getProgress(operationId);
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): ProgressInfo[] {
    return this.progressTracker.getActiveOperations();
  }

  /**
   * Get batch operation status
   */
  getBatchOperation(operationId: UUID): BatchOperation | null {
    return this.batchProcessor.getOperation(operationId);
  }

  /**
   * Get processing statistics
   */
  getProcessingStatistics(): {
    operations: any;
    performance: {
      averageConversionTime: number;
      averageValidationTime: number;
      totalFilesProcessed: number;
      successRate: number;
    };
  } {
    const operationStats = this.progressTracker.getStatistics();
    
    // This would be enhanced with actual performance metrics
    const performance = {
      averageConversionTime: operationStats.averageCompletionTime,
      averageValidationTime: operationStats.averageCompletionTime * 0.3, // Estimated
      totalFilesProcessed: operationStats.completed,
      successRate: operationStats.total > 0 ? (operationStats.completed / operationStats.total) * 100 : 0
    };

    return {
      operations: operationStats,
      performance
    };
  }

  /**
   * Cleanup old operations and free memory
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    this.progressTracker.cleanup(maxAge);
  }

  /**
   * Optimize file for specific use case
   */
  async optimizeFile(
    file: FileReference,
    useCase: 'web' | 'mobile' | 'print' | 'archive',
    processingOptions: FileProcessingOptions = {}
  ): Promise<ProcessingResult<ConversionResult>> {
    const operationId = generateOperationId('optimize');
    
    // Determine optimization strategy based on use case and file type
    let targetFormat: string;
    let conversionOptions: FileConversionOptions = {};

    if (file.isImage()) {
      switch (useCase) {
        case 'web':
          targetFormat = 'webp';
          conversionOptions = { quality: 0.8, compression: 80 };
          break;
        case 'mobile':
          targetFormat = 'jpg';
          conversionOptions = { quality: 0.7, compression: 85 };
          break;
        case 'print':
          targetFormat = 'png';
          conversionOptions = { preserveMetadata: true };
          break;
        case 'archive':
          targetFormat = 'png';
          conversionOptions = { quality: 1.0, preserveMetadata: true };
          break;
        default:
          targetFormat = file.getFileExtension();
      }
    } else if (file.isDocument()) {
      switch (useCase) {
        case 'web':
        case 'mobile':
          targetFormat = 'html';
          break;
        case 'print':
        case 'archive':
          targetFormat = 'pdf';
          break;
        default:
          targetFormat = file.getFileExtension();
      }
    } else {
      // No optimization needed for other file types
      return {
        success: true,
        result: {
          success: true,
          data: new Blob(),
          url: file.url,
          metadata: { optimized: false, reason: 'No optimization available for this file type' }
        },
        operationId,
        processingTime: 0
      };
    }

    return this.convertFile(file, targetFormat, conversionOptions, processingOptions);
  }
}