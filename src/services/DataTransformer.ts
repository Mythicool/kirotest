import { FileReference } from '../models/FileReference';
import { FileConversionOptions, FileProcessingStatus } from '../types/file';
import { UUID } from '../types/common';

export interface ConversionResult {
  success: boolean;
  data?: Blob | string;
  url?: string;
  metadata?: Record<string, any>;
  error?: string;
  warnings?: string[];
}

export interface ConversionProgress {
  operationId: UUID;
  progress: number; // 0-100
  stage: string;
  estimatedTimeRemaining?: number;
}

export interface SupportedFormat {
  extension: string;
  mimeType: string;
  category: 'image' | 'document' | 'audio' | 'video' | 'code' | 'archive';
  canConvertTo: string[];
  canConvertFrom: string[];
}

export class DataTransformer {
  private static instance: DataTransformer;
  private activeOperations = new Map<UUID, AbortController>();
  private progressCallbacks = new Map<UUID, (progress: ConversionProgress) => void>();

  // Supported formats configuration
  private readonly supportedFormats: SupportedFormat[] = [
    // Images
    {
      extension: 'jpg',
      mimeType: 'image/jpeg',
      category: 'image',
      canConvertTo: ['png', 'webp', 'gif', 'bmp', 'svg'],
      canConvertFrom: ['png', 'webp', 'gif', 'bmp', 'svg', 'raw']
    },
    {
      extension: 'png',
      mimeType: 'image/png',
      category: 'image',
      canConvertTo: ['jpg', 'webp', 'gif', 'bmp', 'svg'],
      canConvertFrom: ['jpg', 'webp', 'gif', 'bmp', 'svg', 'raw']
    },
    {
      extension: 'webp',
      mimeType: 'image/webp',
      category: 'image',
      canConvertTo: ['jpg', 'png', 'gif', 'bmp'],
      canConvertFrom: ['jpg', 'png', 'gif', 'bmp']
    },
    {
      extension: 'svg',
      mimeType: 'image/svg+xml',
      category: 'image',
      canConvertTo: ['png', 'jpg', 'webp', 'pdf'],
      canConvertFrom: ['png', 'jpg', 'webp']
    },
    // Documents
    {
      extension: 'pdf',
      mimeType: 'application/pdf',
      category: 'document',
      canConvertTo: ['txt', 'html', 'docx', 'png', 'jpg'],
      canConvertFrom: ['txt', 'html', 'docx', 'md', 'rtf']
    },
    {
      extension: 'md',
      mimeType: 'text/markdown',
      category: 'document',
      canConvertTo: ['html', 'pdf', 'docx', 'txt'],
      canConvertFrom: ['txt', 'html', 'docx']
    },
    {
      extension: 'html',
      mimeType: 'text/html',
      category: 'document',
      canConvertTo: ['pdf', 'md', 'txt', 'docx'],
      canConvertFrom: ['md', 'txt', 'docx']
    },
    // Code
    {
      extension: 'js',
      mimeType: 'application/javascript',
      category: 'code',
      canConvertTo: ['ts', 'json', 'txt'],
      canConvertFrom: ['ts', 'json', 'txt']
    },
    {
      extension: 'ts',
      mimeType: 'application/typescript',
      category: 'code',
      canConvertTo: ['js', 'json', 'txt'],
      canConvertFrom: ['js', 'json', 'txt']
    },
    {
      extension: 'json',
      mimeType: 'application/json',
      category: 'code',
      canConvertTo: ['yaml', 'xml', 'csv', 'txt'],
      canConvertFrom: ['yaml', 'xml', 'csv', 'txt']
    }
  ];

  private constructor() {}

  static getInstance(): DataTransformer {
    if (!DataTransformer.instance) {
      DataTransformer.instance = new DataTransformer();
    }
    return DataTransformer.instance;
  }

  /**
   * Convert a file from one format to another
   */
  async convertFile(
    file: FileReference,
    targetFormat: string,
    options: FileConversionOptions = {},
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    const operationId = this.generateOperationId();
    const abortController = new AbortController();
    
    this.activeOperations.set(operationId, abortController);
    if (onProgress) {
      this.progressCallbacks.set(operationId, onProgress);
    }

    try {
      // Update file processing status
      file.processingStatus = FileProcessingStatus.PROCESSING;
      await file.save();

      this.reportProgress(operationId, 10, 'Validating conversion');

      // Validate conversion is supported
      const sourceFormat = file.getFileExtension();
      const conversionSupported = this.isConversionSupported(sourceFormat, targetFormat);
      
      if (!conversionSupported) {
        throw new Error(`Conversion from ${sourceFormat} to ${targetFormat} is not supported`);
      }

      this.reportProgress(operationId, 20, 'Loading file data');

      // Load file data
      const fileData = await this.loadFileData(file.url, abortController.signal);
      
      this.reportProgress(operationId, 40, 'Converting format');

      // Perform conversion based on file types
      const result = await this.performConversion(
        fileData,
        sourceFormat,
        targetFormat,
        options,
        operationId,
        abortController.signal
      );

      this.reportProgress(operationId, 90, 'Finalizing conversion');

      // Update file processing status
      file.processingStatus = FileProcessingStatus.COMPLETED;
      await file.save();

      this.reportProgress(operationId, 100, 'Conversion completed');

      return result;

    } catch (error) {
      file.processingStatus = FileProcessingStatus.FAILED;
      await file.save();

      if (error instanceof Error && error.name === 'AbortError') {
        file.processingStatus = FileProcessingStatus.CANCELLED;
        await file.save();
        return { success: false, error: 'Conversion cancelled' };
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown conversion error' 
      };
    } finally {
      this.activeOperations.delete(operationId);
      this.progressCallbacks.delete(operationId);
    }
  }

  /**
   * Cancel an active conversion operation
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
   * Get supported formats for a given file type
   */
  getSupportedFormats(sourceFormat?: string): SupportedFormat[] {
    if (!sourceFormat) {
      return this.supportedFormats;
    }

    const format = this.supportedFormats.find(f => f.extension === sourceFormat.toLowerCase());
    if (!format) return [];

    return this.supportedFormats.filter(f => 
      format.canConvertTo.includes(f.extension)
    );
  }

  /**
   * Check if conversion between two formats is supported
   */
  isConversionSupported(sourceFormat: string, targetFormat: string): boolean {
    const source = this.supportedFormats.find(f => f.extension === sourceFormat.toLowerCase());
    return source ? source.canConvertTo.includes(targetFormat.toLowerCase()) : false;
  }

  /**
   * Get conversion capabilities for a file
   */
  getConversionCapabilities(file: FileReference): {
    supportedFormats: string[];
    category: string;
    recommendations: string[];
  } {
    const sourceFormat = file.getFileExtension();
    const format = this.supportedFormats.find(f => f.extension === sourceFormat);
    
    if (!format) {
      return {
        supportedFormats: [],
        category: 'unknown',
        recommendations: []
      };
    }

    // Provide smart recommendations based on file type and use case
    const recommendations = this.getSmartRecommendations(format);

    return {
      supportedFormats: format.canConvertTo,
      category: format.category,
      recommendations
    };
  }

  private async loadFileData(url: string, signal: AbortSignal): Promise<Blob> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`);
    }
    return response.blob();
  }

  private async performConversion(
    data: Blob,
    sourceFormat: string,
    targetFormat: string,
    options: FileConversionOptions,
    operationId: UUID,
    signal: AbortSignal
  ): Promise<ConversionResult> {
    const sourceCategory = this.getFormatCategory(sourceFormat);
    const targetCategory = this.getFormatCategory(targetFormat);

    // Route to appropriate conversion method
    if (sourceCategory === 'image' && targetCategory === 'image') {
      return this.convertImage(data, sourceFormat, targetFormat, options, operationId, signal);
    } else if (sourceCategory === 'document' || targetCategory === 'document') {
      return this.convertDocument(data, sourceFormat, targetFormat, options, operationId, signal);
    } else if (sourceCategory === 'code' || targetCategory === 'code') {
      return this.convertCode(data, sourceFormat, targetFormat, options, operationId, signal);
    } else {
      throw new Error(`Conversion between ${sourceCategory} and ${targetCategory} not implemented`);
    }
  }

  private async convertImage(
    data: Blob,
    sourceFormat: string,
    targetFormat: string,
    options: FileConversionOptions,
    operationId: UUID,
    signal: AbortSignal
  ): Promise<ConversionResult> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          if (signal.aborted) {
            reject(new Error('Conversion cancelled'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0);

          this.reportProgress(operationId, 70, 'Applying conversion settings');

          // Apply quality settings for lossy formats
          let quality = options.quality || 0.9;
          if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
            quality = Math.max(0.1, Math.min(1.0, quality));
          }

          // Convert to target format
          const mimeType = this.getMimeTypeForExtension(targetFormat);
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image'));
              return;
            }

            const url = URL.createObjectURL(blob);
            resolve({
              success: true,
              data: blob,
              url,
              metadata: {
                width: canvas.width,
                height: canvas.height,
                format: targetFormat,
                quality: targetFormat === 'jpg' ? quality : undefined
              }
            });
          }, mimeType, quality);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for conversion'));
      };

      img.src = URL.createObjectURL(data);
    });
  }

  private async convertDocument(
    data: Blob,
    sourceFormat: string,
    targetFormat: string,
    options: FileConversionOptions,
    operationId: UUID,
    signal: AbortSignal
  ): Promise<ConversionResult> {
    const text = await data.text();
    
    this.reportProgress(operationId, 60, 'Processing document content');

    let convertedContent: string;
    let mimeType: string;

    // Handle common document conversions
    if (sourceFormat === 'md' && targetFormat === 'html') {
      convertedContent = this.markdownToHtml(text);
      mimeType = 'text/html';
    } else if (sourceFormat === 'html' && targetFormat === 'md') {
      convertedContent = this.htmlToMarkdown(text);
      mimeType = 'text/markdown';
    } else if (targetFormat === 'txt') {
      convertedContent = this.stripFormatting(text, sourceFormat);
      mimeType = 'text/plain';
    } else {
      throw new Error(`Document conversion from ${sourceFormat} to ${targetFormat} not implemented`);
    }

    this.reportProgress(operationId, 80, 'Creating converted file');

    const blob = new Blob([convertedContent], { type: mimeType });
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      data: blob,
      url,
      metadata: {
        format: targetFormat,
        wordCount: convertedContent.split(/\s+/).length,
        characterCount: convertedContent.length
      }
    };
  }

  private async convertCode(
    data: Blob,
    sourceFormat: string,
    targetFormat: string,
    options: FileConversionOptions,
    operationId: UUID,
    signal: AbortSignal
  ): Promise<ConversionResult> {
    const text = await data.text();
    
    this.reportProgress(operationId, 60, 'Processing code content');

    let convertedContent: string;
    let mimeType: string;

    // Handle code conversions
    if (sourceFormat === 'json' && targetFormat === 'yaml') {
      const jsonData = JSON.parse(text);
      convertedContent = this.jsonToYaml(jsonData);
      mimeType = 'application/x-yaml';
    } else if (sourceFormat === 'yaml' && targetFormat === 'json') {
      const yamlData = this.yamlToJson(text);
      convertedContent = JSON.stringify(yamlData, null, 2);
      mimeType = 'application/json';
    } else if (targetFormat === 'txt') {
      convertedContent = text; // Code to plain text is just the raw content
      mimeType = 'text/plain';
    } else {
      throw new Error(`Code conversion from ${sourceFormat} to ${targetFormat} not implemented`);
    }

    this.reportProgress(operationId, 80, 'Creating converted file');

    const blob = new Blob([convertedContent], { type: mimeType });
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      data: blob,
      url,
      metadata: {
        format: targetFormat,
        lineCount: convertedContent.split('\n').length,
        characterCount: convertedContent.length
      }
    };
  }

  // Helper methods for format conversion
  private markdownToHtml(markdown: string): string {
    // Basic markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n/gim, '<br>');
  }

  private htmlToMarkdown(html: string): string {
    // Basic HTML to markdown conversion
    return html
      .replace(/<h1>(.*?)<\/h1>/gim, '# $1')
      .replace(/<h2>(.*?)<\/h2>/gim, '## $1')
      .replace(/<h3>(.*?)<\/h3>/gim, '### $1')
      .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
      .replace(/<em>(.*?)<\/em>/gim, '*$1*')
      .replace(/<a href="([^"]+)">(.*?)<\/a>/gim, '[$2]($1)')
      .replace(/<br\s*\/?>/gim, '\n')
      .replace(/<[^>]+>/gim, ''); // Remove remaining HTML tags
  }

  private stripFormatting(text: string, sourceFormat: string): string {
    if (sourceFormat === 'html') {
      return text.replace(/<[^>]+>/gim, '').replace(/&[^;]+;/gim, '');
    } else if (sourceFormat === 'md') {
      return text
        .replace(/^#+\s/gim, '')
        .replace(/\*\*(.*?)\*\*/gim, '$1')
        .replace(/\*(.*?)\*/gim, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/gim, '$1');
    }
    return text;
  }

  private jsonToYaml(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      obj.forEach(item => {
        yaml += `${spaces}- ${this.jsonToYaml(item, indent + 1)}\n`;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object') {
          yaml += `${spaces}${key}:\n${this.jsonToYaml(value, indent + 1)}`;
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      });
    } else {
      return String(obj);
    }

    return yaml;
  }

  private yamlToJson(yaml: string): any {
    // Basic YAML to JSON conversion (simplified)
    const lines = yaml.split('\n').filter(line => line.trim());
    const result: any = {};
    
    lines.forEach(line => {
      const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
      if (match) {
        const [, , key, value] = match;
        result[key.trim()] = value || null;
      }
    });

    return result;
  }

  private getFormatCategory(format: string): string {
    const formatInfo = this.supportedFormats.find(f => f.extension === format.toLowerCase());
    return formatInfo?.category || 'unknown';
  }

  private getMimeTypeForExtension(extension: string): string {
    const format = this.supportedFormats.find(f => f.extension === extension.toLowerCase());
    return format?.mimeType || 'application/octet-stream';
  }

  private getSmartRecommendations(format: SupportedFormat): string[] {
    const recommendations: string[] = [];

    switch (format.category) {
      case 'image':
        if (format.extension === 'png') {
          recommendations.push('jpg', 'webp'); // For smaller file sizes
        } else if (format.extension === 'jpg') {
          recommendations.push('webp', 'png'); // For better quality or transparency
        }
        break;
      case 'document':
        if (format.extension === 'md') {
          recommendations.push('html', 'pdf'); // For publishing
        } else if (format.extension === 'html') {
          recommendations.push('pdf', 'md'); // For archiving or editing
        }
        break;
      case 'code':
        if (format.extension === 'json') {
          recommendations.push('yaml', 'csv'); // For configuration or data
        }
        break;
    }

    return recommendations;
  }

  private reportProgress(operationId: UUID, progress: number, stage: string): void {
    const callback = this.progressCallbacks.get(operationId);
    if (callback) {
      callback({
        operationId,
        progress,
        stage
      });
    }
  }

  private generateOperationId(): UUID {
    return `transform_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}