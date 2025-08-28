import { FileReference } from '../models/FileReference';
import { FileProcessingStatus } from '../types/file';
import { UUID } from '../types/common';

export interface StreamingOptions {
  chunkSize?: number; // Default 64KB
  maxConcurrentChunks?: number; // Default 3
  enableCompression?: boolean;
  enableChecksum?: boolean;
  onProgress?: (progress: StreamingProgress) => void;
  onChunkProcessed?: (chunkIndex: number, totalChunks: number) => void;
}

export interface StreamingProgress {
  operationId: UUID;
  bytesProcessed: number;
  totalBytes: number;
  progress: number; // 0-100
  currentChunk: number;
  totalChunks: number;
  stage: StreamingStage;
  estimatedTimeRemaining?: number;
  throughput?: number; // bytes per second
}

export enum StreamingStage {
  INITIALIZING = 'initializing',
  READING = 'reading',
  PROCESSING = 'processing',
  WRITING = 'writing',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface ChunkInfo {
  index: number;
  offset: number;
  size: number;
  checksum?: string;
  data?: ArrayBuffer;
}

export interface StreamingResult {
  success: boolean;
  processedBytes: number;
  totalChunks: number;
  processingTime: number;
  averageThroughput: number;
  checksum?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class StreamingFileProcessor {
  private static instance: StreamingFileProcessor;
  private activeOperations = new Map<UUID, AbortController>();
  private progressTrackers = new Map<UUID, StreamingProgress>();

  // Default configuration
  private readonly defaultOptions: Required<Omit<StreamingOptions, 'onProgress' | 'onChunkProcessed'>> = {
    chunkSize: 64 * 1024, // 64KB
    maxConcurrentChunks: 3,
    enableCompression: false,
    enableChecksum: true
  };

  private constructor() {}

  static getInstance(): StreamingFileProcessor {
    if (!StreamingFileProcessor.instance) {
      StreamingFileProcessor.instance = new StreamingFileProcessor();
    }
    return StreamingFileProcessor.instance;
  }

  /**
   * Process a large file using streaming approach
   */
  async processFile(
    file: FileReference,
    processor: (chunk: ArrayBuffer, chunkInfo: ChunkInfo) => Promise<ArrayBuffer | void>,
    options: StreamingOptions = {}
  ): Promise<StreamingResult> {
    const operationId = this.generateOperationId();
    const abortController = new AbortController();
    const startTime = Date.now();
    
    const config = { ...this.defaultOptions, ...options };
    
    this.activeOperations.set(operationId, abortController);

    try {
      // Initialize progress tracking
      const progress: StreamingProgress = {
        operationId,
        bytesProcessed: 0,
        totalBytes: file.size,
        progress: 0,
        currentChunk: 0,
        totalChunks: Math.ceil(file.size / config.chunkSize),
        stage: StreamingStage.INITIALIZING
      };
      
      this.progressTrackers.set(operationId, progress);
      this.reportProgress(progress, options.onProgress);

      // Update file status
      file.processingStatus = FileProcessingStatus.PROCESSING;
      await file.save();

      // Load file data
      progress.stage = StreamingStage.READING;
      this.reportProgress(progress, options.onProgress);

      const fileData = await this.loadFileAsArrayBuffer(file.url, abortController.signal);
      
      // Process file in chunks
      progress.stage = StreamingStage.PROCESSING;
      this.reportProgress(progress, options.onProgress);

      const result = await this.processInChunks(
        fileData,
        processor,
        config,
        progress,
        abortController.signal,
        options.onProgress,
        options.onChunkProcessed
      );

      // Finalize
      progress.stage = StreamingStage.FINALIZING;
      progress.progress = 95;
      this.reportProgress(progress, options.onProgress);

      file.processingStatus = FileProcessingStatus.COMPLETED;
      await file.save();

      progress.stage = StreamingStage.COMPLETED;
      progress.progress = 100;
      this.reportProgress(progress, options.onProgress);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      return {
        success: true,
        processedBytes: fileData.byteLength,
        totalChunks: progress.totalChunks,
        processingTime,
        averageThroughput: fileData.byteLength / (processingTime / 1000),
        checksum: config.enableChecksum ? await this.calculateChecksum(fileData) : undefined,
        metadata: result.metadata
      };

    } catch (error) {
      file.processingStatus = FileProcessingStatus.FAILED;
      await file.save();

      const progress = this.progressTrackers.get(operationId);
      if (progress) {
        progress.stage = StreamingStage.ERROR;
        this.reportProgress(progress, options.onProgress);
      }

      if (error instanceof Error && error.name === 'AbortError') {
        file.processingStatus = FileProcessingStatus.CANCELLED;
        await file.save();
        return {
          success: false,
          processedBytes: 0,
          totalChunks: 0,
          processingTime: Date.now() - startTime,
          averageThroughput: 0,
          error: 'Processing cancelled'
        };
      }

      return {
        success: false,
        processedBytes: 0,
        totalChunks: 0,
        processingTime: Date.now() - startTime,
        averageThroughput: 0,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      };
    } finally {
      this.activeOperations.delete(operationId);
      this.progressTrackers.delete(operationId);
    }
  }

  /**
   * Process multiple files concurrently with streaming
   */
  async processBatch(
    files: FileReference[],
    processor: (chunk: ArrayBuffer, chunkInfo: ChunkInfo, fileIndex: number) => Promise<ArrayBuffer | void>,
    options: StreamingOptions = {}
  ): Promise<StreamingResult[]> {
    const maxConcurrent = options.maxConcurrentChunks || 2;
    const results: StreamingResult[] = [];
    
    // Process files in batches to avoid overwhelming the system
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchPromises = batch.map((file, batchIndex) => 
        this.processFile(
          file,
          (chunk, chunkInfo) => processor(chunk, chunkInfo, i + batchIndex),
          {
            ...options,
            onProgress: options.onProgress ? (progress) => {
              // Adjust progress to account for batch processing
              const adjustedProgress = {
                ...progress,
                progress: (progress.progress + (i * 100)) / files.length
              };
              options.onProgress!(adjustedProgress);
            } : undefined
          }
        )
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Cancel an active streaming operation
   */
  cancelOperation(operationId: UUID): boolean {
    const controller = this.activeOperations.get(operationId);
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  }

  /**
   * Get current progress for an operation
   */
  getProgress(operationId: UUID): StreamingProgress | null {
    return this.progressTrackers.get(operationId) || null;
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): UUID[] {
    return Array.from(this.activeOperations.keys());
  }

  private async loadFileAsArrayBuffer(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`);
    }
    return response.arrayBuffer();
  }

  private async processInChunks(
    data: ArrayBuffer,
    processor: (chunk: ArrayBuffer, chunkInfo: ChunkInfo) => Promise<ArrayBuffer | void>,
    config: Required<Omit<StreamingOptions, 'onProgress' | 'onChunkProcessed'>>,
    progress: StreamingProgress,
    signal: AbortSignal,
    onProgress?: (progress: StreamingProgress) => void,
    onChunkProcessed?: (chunkIndex: number, totalChunks: number) => void
  ): Promise<{ metadata?: Record<string, any> }> {
    const chunks: ChunkInfo[] = [];
    const processedChunks: ArrayBuffer[] = [];
    let metadata: Record<string, any> = {};

    // Create chunk information
    for (let offset = 0; offset < data.byteLength; offset += config.chunkSize) {
      const size = Math.min(config.chunkSize, data.byteLength - offset);
      chunks.push({
        index: chunks.length,
        offset,
        size,
        data: data.slice(offset, offset + size)
      });
    }

    // Add checksums if enabled
    if (config.enableChecksum) {
      for (const chunk of chunks) {
        if (chunk.data) {
          chunk.checksum = await this.calculateChecksum(chunk.data);
        }
      }
    }

    // Process chunks with concurrency control
    const semaphore = new Semaphore(config.maxConcurrentChunks);
    const processingPromises: Promise<void>[] = [];

    for (const chunk of chunks) {
      const processingPromise = semaphore.acquire().then(async (release) => {
        try {
          if (signal.aborted) {
            throw new Error('Processing cancelled');
          }

          if (!chunk.data) {
            throw new Error('Chunk data is missing');
          }

          // Process the chunk
          const result = await processor(chunk.data, chunk);
          
          if (result) {
            processedChunks[chunk.index] = result;
          }

          // Update progress
          progress.currentChunk = chunk.index + 1;
          progress.bytesProcessed += chunk.size;
          progress.progress = Math.round((progress.bytesProcessed / progress.totalBytes) * 100);
          
          // Calculate throughput
          const elapsed = Date.now() - (progress as any).startTime || Date.now();
          progress.throughput = progress.bytesProcessed / (elapsed / 1000);
          
          // Estimate remaining time
          if (progress.throughput > 0) {
            const remainingBytes = progress.totalBytes - progress.bytesProcessed;
            progress.estimatedTimeRemaining = remainingBytes / progress.throughput;
          }

          this.reportProgress(progress, onProgress);
          
          if (onChunkProcessed) {
            onChunkProcessed(chunk.index, progress.totalChunks);
          }

        } finally {
          release();
        }
      });

      processingPromises.push(processingPromise);
    }

    // Wait for all chunks to be processed
    await Promise.all(processingPromises);

    // Collect metadata from processing
    metadata = {
      totalChunks: chunks.length,
      chunkSize: config.chunkSize,
      compressionEnabled: config.enableCompression,
      checksumEnabled: config.enableChecksum,
      processedChunks: processedChunks.length
    };

    return { metadata };
  }

  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private reportProgress(
    progress: StreamingProgress,
    onProgress?: (progress: StreamingProgress) => void
  ): void {
    if (onProgress) {
      onProgress({ ...progress });
    }
  }

  private generateOperationId(): UUID {
    return `stream_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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