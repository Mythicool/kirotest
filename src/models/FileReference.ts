import {
  FileReference as IFileReference,
  FileMetadata,
  FileVersion,
  FilePermissions,
  FileTag,
  FileSource,
  FileProcessingStatus,
  FileSearchOptions,
  FileValidationRule,
  FileValidationResult
} from '../types/file';
import { UUID, MimeType, URL } from '../types/common';

export class FileReference implements IFileReference {
  id: UUID;
  name: string;
  originalName: string;
  description?: string;
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
  created: Date;
  lastModified: Date;

  constructor(data: Partial<IFileReference> & { 
    name: string; 
    type: MimeType; 
    size: number; 
    url: URL; 
    workspaceId: UUID;
  }) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.originalName = data.originalName || data.name;
    this.description = data.description;
    this.type = data.type;
    this.size = data.size;
    this.url = data.url;
    this.localPath = data.localPath;
    this.thumbnail = data.thumbnail;
    this.metadata = data.metadata || this.initializeMetadata();
    this.versions = data.versions || [];
    this.permissions = data.permissions || this.getDefaultPermissions();
    this.tags = data.tags || [];
    this.workspaceId = data.workspaceId;
    this.parentFileId = data.parentFileId;
    this.childFileIds = data.childFileIds || [];
    this.isTemporary = data.isTemporary || false;
    this.expiresAt = data.expiresAt;
    this.source = data.source || FileSource.UPLOAD;
    this.processingStatus = data.processingStatus || FileProcessingStatus.COMPLETED;
    this.downloadCount = data.downloadCount || 0;
    this.lastAccessed = data.lastAccessed || new Date();
    this.created = data.created || new Date();
    this.lastModified = data.lastModified || new Date();

    // Create initial version
    if (this.versions.length === 0) {
      this.versions.push(this.createInitialVersion());
    }
  }

  private generateId(): UUID {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private initializeMetadata(): FileMetadata {
    return {
      customProperties: {}
    };
  }

  private getDefaultPermissions(): FilePermissions {
    return {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
      canDownload: true
    };
  }

  private createInitialVersion(): FileVersion {
    return {
      id: `version_${this.id}_1`,
      version: 1,
      created: this.created,
      size: this.size,
      checksum: this.generateChecksum(),
      url: this.url
    };
  }

  private generateChecksum(): string {
    // Simple checksum based on file properties
    const data = `${this.name}${this.size}${this.created.getTime()}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // CRUD Operations
  static async create(data: {
    name: string;
    type: MimeType;
    size: number;
    url: URL;
    workspaceId: UUID;
  } & Partial<IFileReference>): Promise<FileReference> {
    const file = new FileReference(data);
    await file.save();
    return file;
  }

  static async findById(id: UUID): Promise<FileReference | null> {
    try {
      const data = localStorage.getItem(`file_${id}`);
      if (!data) return null;

      const parsed = JSON.parse(data);
      return new FileReference({
        ...parsed,
        created: new Date(parsed.created),
        lastModified: new Date(parsed.lastModified),
        lastAccessed: new Date(parsed.lastAccessed),
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
        versions: parsed.versions.map((v: any) => ({
          ...v,
          created: new Date(v.created)
        }))
      });
    } catch (error) {
      console.error('Error loading file:', error);
      return null;
    }
  }

  static async findByWorkspace(workspaceId: UUID, options?: FileSearchOptions): Promise<FileReference[]> {
    const files: FileReference[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('file_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.workspaceId === workspaceId) {
              const file = new FileReference({
                ...parsed,
                created: new Date(parsed.created),
                lastModified: new Date(parsed.lastModified),
                lastAccessed: new Date(parsed.lastAccessed),
                expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
                versions: parsed.versions.map((v: any) => ({
                  ...v,
                  created: new Date(v.created)
                }))
              });

              if (this.matchesSearchOptions(file, options)) {
                files.push(file);
              }
            }
          }
        } catch (error) {
          console.error(`Error loading file from key ${key}:`, error);
        }
      }
    }

    return files;
  }

  private static matchesSearchOptions(file: FileReference, options?: FileSearchOptions): boolean {
    if (!options) return true;

    if (options.query) {
      const query = options.query.toLowerCase();
      const matchesName = file.name.toLowerCase().includes(query);
      const matchesDescription = file.description?.toLowerCase().includes(query);
      const matchesTags = file.tags.some(tag => tag.name.toLowerCase().includes(query));
      
      if (!matchesName && !matchesDescription && !matchesTags) return false;
    }

    if (options.types && options.types.length > 0) {
      if (!options.types.includes(file.type)) return false;
    }

    if (options.tags && options.tags.length > 0) {
      const hasMatchingTag = options.tags.some(tag => 
        file.tags.some(fileTag => fileTag.name === tag)
      );
      if (!hasMatchingTag) return false;
    }

    if (options.sizeRange) {
      if (file.size < options.sizeRange.min || file.size > options.sizeRange.max) {
        return false;
      }
    }

    if (options.dateRange) {
      const created = file.created.getTime();
      const start = options.dateRange.start.getTime();
      const end = options.dateRange.end.getTime();
      
      if (created < start || created > end) return false;
    }

    return true;
  }

  async save(): Promise<void> {
    this.lastModified = new Date();
    
    try {
      const data = this.toJSON();
      localStorage.setItem(`file_${this.id}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('Failed to save file');
    }
  }

  async delete(): Promise<void> {
    try {
      localStorage.removeItem(`file_${this.id}`);
      
      // Remove all versions
      this.versions.forEach(version => {
        localStorage.removeItem(`file_version_${version.id}`);
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Version management
  async createVersion(changes?: string): Promise<FileVersion> {
    const newVersion: FileVersion = {
      id: `version_${this.id}_${this.versions.length + 1}`,
      version: this.versions.length + 1,
      created: new Date(),
      size: this.size,
      checksum: this.generateChecksum(),
      url: this.url,
      changes
    };

    this.versions.push(newVersion);
    await this.save();
    
    return newVersion;
  }

  getVersion(version: number): FileVersion | undefined {
    return this.versions.find(v => v.version === version);
  }

  getLatestVersion(): FileVersion {
    return this.versions[this.versions.length - 1];
  }

  async revertToVersion(version: number): Promise<boolean> {
    const targetVersion = this.getVersion(version);
    if (!targetVersion) return false;

    // Create a new version that reverts to the target
    await this.createVersion(`Reverted to version ${version}`);
    return true;
  }

  // Metadata management
  updateMetadata(metadata: Partial<FileMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.lastModified = new Date();
  }

  addCustomProperty(key: string, value: any): void {
    this.metadata.customProperties[key] = value;
    this.lastModified = new Date();
  }

  removeCustomProperty(key: string): boolean {
    if (key in this.metadata.customProperties) {
      delete this.metadata.customProperties[key];
      this.lastModified = new Date();
      return true;
    }
    return false;
  }

  // Tag management
  addTag(tag: FileTag): void {
    if (!this.tags.find(t => t.name === tag.name)) {
      this.tags.push(tag);
      this.lastModified = new Date();
    }
  }

  removeTag(tagName: string): boolean {
    const index = this.tags.findIndex(t => t.name === tagName);
    if (index !== -1) {
      this.tags.splice(index, 1);
      this.lastModified = new Date();
      return true;
    }
    return false;
  }

  hasTag(tagName: string): boolean {
    return this.tags.some(t => t.name === tagName);
  }

  // Permission management
  updatePermissions(permissions: Partial<FilePermissions>): void {
    this.permissions = { ...this.permissions, ...permissions };
    this.lastModified = new Date();
  }

  canPerformAction(action: keyof FilePermissions): boolean {
    if (this.expiresAt && new Date() > this.expiresAt) {
      return false;
    }
    const permission = this.permissions[action];
    return typeof permission === 'boolean' ? permission : false;
  }

  // File operations
  async duplicate(newName?: string): Promise<FileReference> {
    const duplicateData = {
      ...this,
      id: undefined, // Will generate new ID
      name: newName || `${this.name} (Copy)`,
      originalName: this.originalName,
      created: undefined, // Will use current date
      lastModified: undefined, // Will use current date
      versions: [], // Will create new initial version
      downloadCount: 0,
      source: FileSource.GENERATED
    };

    return FileReference.create(duplicateData);
  }

  markAccessed(): void {
    this.lastAccessed = new Date();
    this.downloadCount++;
  }

  // Validation
  static validate(file: FileReference, rules: FileValidationRule[]): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    for (const rule of rules) {
      try {
        const isValid = rule.validator(file);
        if (!isValid) {
          result.isValid = false;
          result.errors.push(rule.errorMessage);
        }
      } catch (error) {
        result.isValid = false;
        result.errors.push(`Validation error: ${error}`);
      }
    }

    return result;
  }

  // File type detection
  static detectMimeType(filename: string): MimeType {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, MimeType> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'md': 'text/markdown',
      
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      
      // Video
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      
      // Code
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'html': 'text/html',
      'css': 'text/css',
      'json': 'application/json',
      'xml': 'application/xml'
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  // Utility methods
  getFileExtension(): string {
    return this.name.split('.').pop()?.toLowerCase() || '';
  }

  isImage(): boolean {
    return this.type.startsWith('image/');
  }

  isVideo(): boolean {
    return this.type.startsWith('video/');
  }

  isAudio(): boolean {
    return this.type.startsWith('audio/');
  }

  isDocument(): boolean {
    return this.type.startsWith('text/') || 
           this.type === 'application/pdf' ||
           this.type.includes('document') ||
           this.type.includes('spreadsheet');
  }

  isCode(): boolean {
    const codeTypes = [
      'application/javascript',
      'application/typescript',
      'text/html',
      'text/css',
      'application/json',
      'application/xml',
      'text/plain'
    ];
    return codeTypes.includes(this.type) || this.getFileExtension() in {
      'js': true, 'ts': true, 'html': true, 'css': true, 'json': true,
      'xml': true, 'py': true, 'java': true, 'cpp': true, 'c': true,
      'php': true, 'rb': true, 'go': true, 'rs': true
    };
  }

  getHumanReadableSize(): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Serialization
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      originalName: this.originalName,
      description: this.description,
      type: this.type,
      size: this.size,
      url: this.url,
      localPath: this.localPath,
      thumbnail: this.thumbnail,
      metadata: this.metadata,
      versions: this.versions.map(v => ({
        ...v,
        created: v.created.toISOString()
      })),
      permissions: this.permissions,
      tags: this.tags,
      workspaceId: this.workspaceId,
      parentFileId: this.parentFileId,
      childFileIds: this.childFileIds,
      isTemporary: this.isTemporary,
      expiresAt: this.expiresAt?.toISOString(),
      source: this.source,
      processingStatus: this.processingStatus,
      downloadCount: this.downloadCount,
      lastAccessed: this.lastAccessed.toISOString(),
      created: this.created.toISOString(),
      lastModified: this.lastModified.toISOString()
    };
  }
}