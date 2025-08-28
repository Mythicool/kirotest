import { FileReference } from '../models/FileReference';
import { FileValidationRule, FileValidationResult } from '../types/file';
import { UUID } from '../types/common';

export interface SecurityScanResult {
  isSafe: boolean;
  threats: ThreatInfo[];
  warnings: string[];
  scanTime: number;
  scannerVersion: string;
}

export interface ThreatInfo {
  type: ThreatType;
  severity: ThreatSeverity;
  description: string;
  location?: string;
  recommendation: string;
}

export enum ThreatType {
  MALWARE = 'malware',
  VIRUS = 'virus',
  SUSPICIOUS_CONTENT = 'suspicious_content',
  EMBEDDED_SCRIPT = 'embedded_script',
  MACRO = 'macro',
  PHISHING = 'phishing',
  UNSAFE_URL = 'unsafe_url',
  OVERSIZED_FILE = 'oversized_file',
  INVALID_FORMAT = 'invalid_format'
}

export enum ThreatSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SanitizationOptions {
  removeMetadata?: boolean;
  stripScripts?: boolean;
  validateStructure?: boolean;
  compressImages?: boolean;
  maxFileSize?: number;
  allowedDomains?: string[];
  blockedExtensions?: string[];
}

export interface SanitizationResult {
  success: boolean;
  sanitizedFile?: Blob;
  sanitizedUrl?: string;
  removedElements: string[];
  warnings: string[];
  sizeReduction?: number;
  error?: string;
}

export class FileValidator {
  private static instance: FileValidator;
  
  // Security patterns and rules
  private readonly suspiciousPatterns = [
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /<script[^>]*>/gi,
    /<iframe[^>]*>/gi,
    /eval\s*\(/gi,
    /document\.write/gi,
    /window\.location/gi,
    /XMLHttpRequest/gi
  ];

  private readonly maliciousExtensions = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'app', 'deb', 'pkg', 'rpm', 'dmg', 'iso', 'msi'
  ];

  private readonly maxFileSizes: Record<string, number> = {
    'image': 50 * 1024 * 1024, // 50MB
    'video': 500 * 1024 * 1024, // 500MB
    'audio': 100 * 1024 * 1024, // 100MB
    'document': 25 * 1024 * 1024, // 25MB
    'code': 10 * 1024 * 1024, // 10MB
    'default': 100 * 1024 * 1024 // 100MB
  };

  private constructor() {}

  static getInstance(): FileValidator {
    if (!FileValidator.instance) {
      FileValidator.instance = new FileValidator();
    }
    return FileValidator.instance;
  }

  /**
   * Comprehensive file validation with security checks
   */
  async validateFile(
    file: FileReference,
    customRules: FileValidationRule[] = []
  ): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Basic file validation
      await this.validateBasicProperties(file, result);
      
      // Security validation
      await this.validateSecurity(file, result);
      
      // Content validation
      await this.validateContent(file, result);
      
      // Apply custom rules
      await this.applyCustomRules(file, customRules, result);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Perform security scan on file
   */
  async scanForThreats(file: FileReference): Promise<SecurityScanResult> {
    const startTime = Date.now();
    const threats: ThreatInfo[] = [];
    const warnings: string[] = [];

    try {
      // Load file content for analysis
      const fileData = await this.loadFileContent(file.url);
      
      // Check file extension
      const extension = file.getFileExtension();
      if (this.maliciousExtensions.includes(extension)) {
        threats.push({
          type: ThreatType.MALWARE,
          severity: ThreatSeverity.HIGH,
          description: `Potentially dangerous file extension: .${extension}`,
          recommendation: 'Do not execute this file. Consider removing it.'
        });
      }

      // Check file size
      const category = this.getFileCategory(file);
      const maxSize = this.maxFileSizes[category] || this.maxFileSizes.default;
      if (file.size > maxSize) {
        threats.push({
          type: ThreatType.OVERSIZED_FILE,
          severity: ThreatSeverity.MEDIUM,
          description: `File size (${file.getHumanReadableSize()}) exceeds limit for ${category} files`,
          recommendation: 'Verify file legitimacy and consider compression.'
        });
      }

      // Content-based scanning
      if (typeof fileData === 'string') {
        await this.scanTextContent(fileData, threats, warnings);
      } else if (fileData instanceof ArrayBuffer) {
        await this.scanBinaryContent(fileData, file, threats, warnings);
      }

      // Check for embedded URLs
      await this.scanForSuspiciousUrls(file, threats, warnings);

    } catch (error) {
      warnings.push(`Security scan incomplete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const scanTime = Date.now() - startTime;

    return {
      isSafe: threats.filter(t => t.severity === ThreatSeverity.HIGH || t.severity === ThreatSeverity.CRITICAL).length === 0,
      threats,
      warnings,
      scanTime,
      scannerVersion: '1.0.0'
    };
  }

  /**
   * Sanitize file content to remove potential threats
   */
  async sanitizeFile(
    file: FileReference,
    options: SanitizationOptions = {}
  ): Promise<SanitizationResult> {
    const result: SanitizationResult = {
      success: false,
      removedElements: [],
      warnings: []
    };

    try {
      const fileData = await this.loadFileContent(file.url);
      let sanitizedContent: string | ArrayBuffer;
      let contentType = file.type;

      if (typeof fileData === 'string') {
        sanitizedContent = await this.sanitizeTextContent(fileData, file, options, result);
      } else {
        sanitizedContent = await this.sanitizeBinaryContent(fileData, file, options, result);
      }

      // Create sanitized blob
      const originalSize = file.size;
      const sanitizedBlob = new Blob([sanitizedContent], { type: contentType });
      const sanitizedUrl = URL.createObjectURL(sanitizedBlob);

      result.success = true;
      result.sanitizedFile = sanitizedBlob;
      result.sanitizedUrl = sanitizedUrl;
      result.sizeReduction = originalSize - sanitizedBlob.size;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown sanitization error';
    }

    return result;
  }

  /**
   * Validate file against custom business rules
   */
  async validateBusinessRules(
    file: FileReference,
    rules: {
      maxSize?: number;
      allowedTypes?: string[];
      requiredMetadata?: string[];
      customValidators?: Array<(file: FileReference) => Promise<boolean>>;
    }
  ): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Size validation
    if (rules.maxSize && file.size > rules.maxSize) {
      result.isValid = false;
      result.errors.push(`File size (${file.getHumanReadableSize()}) exceeds maximum allowed size`);
    }

    // Type validation
    if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
      result.isValid = false;
      result.errors.push(`File type ${file.type} is not allowed`);
    }

    // Metadata validation
    if (rules.requiredMetadata) {
      for (const field of rules.requiredMetadata) {
        if (!file.metadata.customProperties[field]) {
          result.warnings.push(`Missing required metadata field: ${field}`);
        }
      }
    }

    // Custom validators
    if (rules.customValidators) {
      for (const validator of rules.customValidators) {
        try {
          const isValid = await validator(file);
          if (!isValid) {
            result.isValid = false;
            result.errors.push('Custom validation failed');
          }
        } catch (error) {
          result.warnings.push(`Custom validator error: ${error}`);
        }
      }
    }

    return result;
  }

  private async validateBasicProperties(file: FileReference, result: FileValidationResult): Promise<void> {
    // Check required fields
    if (!file.name || file.name.trim().length === 0) {
      result.isValid = false;
      result.errors.push('File name is required');
    }

    if (!file.type) {
      result.warnings.push('File type is not specified');
    }

    if (file.size <= 0) {
      result.isValid = false;
      result.errors.push('File size must be greater than 0');
    }

    // Check file name for suspicious patterns
    if (this.containsSuspiciousPatterns(file.name)) {
      result.warnings.push('File name contains suspicious characters');
    }

    // Validate URL
    try {
      new URL(file.url);
    } catch {
      result.isValid = false;
      result.errors.push('Invalid file URL');
    }
  }

  private async validateSecurity(file: FileReference, result: FileValidationResult): Promise<void> {
    const securityScan = await this.scanForThreats(file);
    
    const criticalThreats = securityScan.threats.filter(t => 
      t.severity === ThreatSeverity.CRITICAL || t.severity === ThreatSeverity.HIGH
    );

    if (criticalThreats.length > 0) {
      result.isValid = false;
      result.errors.push(...criticalThreats.map(t => t.description));
    }

    const mediumThreats = securityScan.threats.filter(t => t.severity === ThreatSeverity.MEDIUM);
    if (mediumThreats.length > 0) {
      result.warnings.push(...mediumThreats.map(t => t.description));
    }
  }

  private async validateContent(file: FileReference, result: FileValidationResult): Promise<void> {
    try {
      const fileData = await this.loadFileContent(file.url);
      
      // Validate file structure based on type
      if (file.isImage()) {
        await this.validateImageContent(fileData, result);
      } else if (file.isDocument()) {
        await this.validateDocumentContent(fileData, result);
      } else if (file.isCode()) {
        await this.validateCodeContent(fileData, result);
      }

    } catch (error) {
      result.warnings.push(`Content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async applyCustomRules(
    file: FileReference,
    rules: FileValidationRule[],
    result: FileValidationResult
  ): Promise<void> {
    for (const rule of rules) {
      try {
        const isValid = await rule.validator(file);
        if (!isValid) {
          result.isValid = false;
          result.errors.push(rule.errorMessage);
        }
      } catch (error) {
        result.warnings.push(`Custom rule '${rule.name}' failed: ${error}`);
      }
    }
  }

  private async loadFileContent(url: string): Promise<string | ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.startsWith('text/') || contentType.includes('json') || contentType.includes('xml')) {
      return response.text();
    } else {
      return response.arrayBuffer();
    }
  }

  private async scanTextContent(content: string, threats: ThreatInfo[], warnings: string[]): Promise<void> {
    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        threats.push({
          type: ThreatType.EMBEDDED_SCRIPT,
          severity: ThreatSeverity.HIGH,
          description: `Suspicious script pattern detected: ${matches[0]}`,
          location: `Character position: ${content.indexOf(matches[0])}`,
          recommendation: 'Remove or sanitize the suspicious content before using this file.'
        });
      }
    }

    // Check for potential phishing content
    const phishingPatterns = [
      /verify.*account/gi,
      /click.*here.*immediately/gi,
      /urgent.*action.*required/gi,
      /suspended.*account/gi
    ];

    for (const pattern of phishingPatterns) {
      if (pattern.test(content)) {
        threats.push({
          type: ThreatType.PHISHING,
          severity: ThreatSeverity.MEDIUM,
          description: 'Content contains potential phishing language',
          recommendation: 'Review content carefully for social engineering attempts.'
        });
        break;
      }
    }
  }

  private async scanBinaryContent(
    content: ArrayBuffer,
    file: FileReference,
    threats: ThreatInfo[],
    warnings: string[]
  ): Promise<void> {
    const bytes = new Uint8Array(content);
    
    // Check for executable signatures
    const executableSignatures = [
      [0x4D, 0x5A], // PE executable (Windows)
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable (Linux)
      [0xCF, 0xFA, 0xED, 0xFE], // Mach-O executable (macOS)
    ];

    for (const signature of executableSignatures) {
      if (this.bytesStartWith(bytes, signature)) {
        threats.push({
          type: ThreatType.MALWARE,
          severity: ThreatSeverity.CRITICAL,
          description: 'File contains executable code signature',
          recommendation: 'Do not execute this file. It may contain malware.'
        });
        break;
      }
    }

    // Check for embedded files (ZIP signature in non-archive files)
    if (!file.type.includes('zip') && !file.type.includes('archive')) {
      const zipSignature = [0x50, 0x4B, 0x03, 0x04];
      if (this.findBytesPattern(bytes, zipSignature) !== -1) {
        warnings.push('File may contain embedded archive data');
      }
    }
  }

  private async scanForSuspiciousUrls(
    file: FileReference,
    threats: ThreatInfo[],
    warnings: string[]
  ): Promise<void> {
    // This would typically integrate with URL reputation services
    // For now, we'll do basic checks
    
    const suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co' // URL shorteners
    ];

    try {
      const fileData = await this.loadFileContent(file.url);
      if (typeof fileData === 'string') {
        const urlPattern = /https?:\/\/[^\s<>"']+/gi;
        const urls = fileData.match(urlPattern) || [];
        
        for (const url of urls) {
          try {
            const urlObj = new URL(url);
            if (suspiciousDomains.includes(urlObj.hostname)) {
              warnings.push(`File contains shortened URL: ${url}`);
            }
          } catch {
            // Invalid URL, skip
          }
        }
      }
    } catch {
      // Unable to scan URLs
    }
  }

  private async sanitizeTextContent(
    content: string,
    file: FileReference,
    options: SanitizationOptions,
    result: SanitizationResult
  ): Promise<string> {
    let sanitized = content;

    // Remove scripts if requested
    if (options.stripScripts !== false) {
      const scriptPattern = /<script[^>]*>.*?<\/script>/gis;
      const scripts = sanitized.match(scriptPattern);
      if (scripts) {
        sanitized = sanitized.replace(scriptPattern, '');
        result.removedElements.push(`${scripts.length} script tag(s)`);
      }

      // Remove event handlers
      const eventPattern = /on\w+\s*=\s*["'][^"']*["']/gi;
      const events = sanitized.match(eventPattern);
      if (events) {
        sanitized = sanitized.replace(eventPattern, '');
        result.removedElements.push(`${events.length} event handler(s)`);
      }
    }

    // Remove suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      const matches = sanitized.match(pattern);
      if (matches) {
        sanitized = sanitized.replace(pattern, '');
        result.removedElements.push(`Suspicious pattern: ${matches[0]}`);
      }
    }

    return sanitized;
  }

  private async sanitizeBinaryContent(
    content: ArrayBuffer,
    file: FileReference,
    options: SanitizationOptions,
    result: SanitizationResult
  ): Promise<ArrayBuffer> {
    // For binary files, we mainly remove metadata if requested
    if (options.removeMetadata && file.isImage()) {
      return this.removeImageMetadata(content);
    }

    return content;
  }

  private async removeImageMetadata(content: ArrayBuffer): Promise<ArrayBuffer> {
    // This is a simplified implementation
    // In a real application, you'd use a proper image processing library
    return content;
  }

  private async validateImageContent(content: string | ArrayBuffer, result: FileValidationResult): Promise<void> {
    if (content instanceof ArrayBuffer) {
      const bytes = new Uint8Array(content);
      
      // Check for valid image signatures
      const imageSignatures = [
        { signature: [0xFF, 0xD8, 0xFF], type: 'JPEG' },
        { signature: [0x89, 0x50, 0x4E, 0x47], type: 'PNG' },
        { signature: [0x47, 0x49, 0x46], type: 'GIF' },
        { signature: [0x52, 0x49, 0x46, 0x46], type: 'WebP' }
      ];

      let validSignature = false;
      for (const { signature, type } of imageSignatures) {
        if (this.bytesStartWith(bytes, signature)) {
          validSignature = true;
          break;
        }
      }

      if (!validSignature) {
        result.warnings.push('Image file does not have a valid signature');
      }
    }
  }

  private async validateDocumentContent(content: string | ArrayBuffer, result: FileValidationResult): Promise<void> {
    if (typeof content === 'string') {
      // Basic document validation
      if (content.trim().length === 0) {
        result.warnings.push('Document appears to be empty');
      }
    }
  }

  private async validateCodeContent(content: string | ArrayBuffer, result: FileValidationResult): Promise<void> {
    if (typeof content === 'string') {
      // Check for potential code injection
      const dangerousPatterns = [
        /eval\s*\(/gi,
        /Function\s*\(/gi,
        /setTimeout\s*\(/gi,
        /setInterval\s*\(/gi
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
          result.warnings.push('Code contains potentially dangerous functions');
          break;
        }
      }
    }
  }

  private containsSuspiciousPatterns(text: string): boolean {
    const suspiciousChars = /[<>"|*?:]/;
    const suspiciousNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    
    return suspiciousChars.test(text) || suspiciousNames.test(text);
  }

  private bytesStartWith(bytes: Uint8Array, signature: number[]): boolean {
    if (bytes.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) return false;
    }
    
    return true;
  }

  private findBytesPattern(bytes: Uint8Array, pattern: number[]): number {
    for (let i = 0; i <= bytes.length - pattern.length; i++) {
      let found = true;
      for (let j = 0; j < pattern.length; j++) {
        if (bytes[i + j] !== pattern[j]) {
          found = false;
          break;
        }
      }
      if (found) return i;
    }
    return -1;
  }

  private getFileCategory(file: FileReference): string {
    if (file.isImage()) return 'image';
    if (file.isVideo()) return 'video';
    if (file.isAudio()) return 'audio';
    if (file.isDocument()) return 'document';
    if (file.isCode()) return 'code';
    return 'default';
  }
}