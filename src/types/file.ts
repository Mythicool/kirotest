// File-related type definitions

import { BaseEntity, Named, UUID, MimeType, URL } from './common';

export interface FileMetadata {
  // Image metadata
  dimensions?: {
    width: number;
    height: number;
  };
  colorProfile?: string;
  dpi?: number;
  hasTransparency?: boolean;
  
  // Audio/Video metadata
  duration?: number; // in seconds
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  
  // Document metadata
  pageCount?: number;
  wordCount?: number;
  documentLanguage?: string;
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  
  // Code metadata
  codeLanguage?: string;
  lineCount?: number;
  encoding?: string;
  
  // General metadata
  customProperties: Record<string, any>;
  extractedText?: string;
  thumbnail?: string;
  preview?: string;
}

export interface FileVersion {
  id: UUID;
  version: number;
  created: Date;
  size: number;
  checksum: string;
  url: URL;
  changes?: string;
  createdBy?: UUID;
}

export interface FilePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  canDownload: boolean;
  expiresAt?: Date;
}

export interface FileTag {
  name: string;
  color?: string;
  category?: string;
}

export interface FileReference extends BaseEntity, Named {
  originalName: string;
  type: MimeType;
  size: number;
  url: URL;
  localPath?: string;
  thumbnail?: URL;
  metadata: FileMetadata;
  versions: FileVersion[];
  permissions: FilePermissions;
  tags: FileTag[];
  workspaceId: UUID;
  parentFileId?: UUID;
  childFileIds: UUID[];
  isTemporary: boolean;
  expiresAt?: Date;
  source: FileSource;
  processingStatus: FileProcessingStatus;
  downloadCount: number;
  lastAccessed: Date;
}

export enum FileSource {
  UPLOAD = 'upload',
  URL_IMPORT = 'url_import',
  TOOL_EXPORT = 'tool_export',
  GENERATED = 'generated',
  TEMPLATE = 'template',
  COLLABORATION = 'collaboration'
}

export enum FileProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: MimeType[];
  generateThumbnail?: boolean;
  extractMetadata?: boolean;
  virusScan?: boolean;
  compress?: boolean;
  quality?: number; // for image compression
}

export interface FileConversionOptions {
  targetFormat: string;
  quality?: number;
  compression?: number;
  preserveMetadata?: boolean;
  customOptions?: Record<string, any>;
}

export interface FileSearchOptions {
  query?: string;
  types?: MimeType[];
  tags?: string[];
  sizeRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  workspaceId?: UUID;
  includeDeleted?: boolean;
}

export interface FileSortOptions {
  field: 'name' | 'size' | 'created' | 'lastModified' | 'type';
  direction: 'asc' | 'desc';
}

export interface FileOperation {
  id: UUID;
  type: 'upload' | 'download' | 'convert' | 'compress' | 'delete' | 'restore';
  fileId: UUID;
  status: FileProcessingStatus;
  progress: number; // 0-100
  startTime: Date;
  endTime?: Date;
  error?: string;
  result?: any;
}

export interface FileShare {
  id: UUID;
  fileId: UUID;
  shareUrl: URL;
  password?: string;
  expiresAt?: Date;
  downloadLimit?: number;
  downloadCount: number;
  allowPreview: boolean;
  allowDownload: boolean;
  created: Date;
  createdBy: UUID;
}

export interface FileComment {
  id: UUID;
  fileId: UUID;
  userId: UUID;
  content: string;
  created: Date;
  lastModified: Date;
  parentCommentId?: UUID;
  resolved: boolean;
  position?: {
    x: number;
    y: number;
    page?: number;
  };
}

// File validation
export interface FileValidationRule {
  name: string;
  validator: (file: FileReference) => boolean | Promise<boolean>;
  errorMessage: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}