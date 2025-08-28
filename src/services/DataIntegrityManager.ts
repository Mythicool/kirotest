import { FileReference } from '@/types/file';
import { Workspace } from '@/types/workspace';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface Checkpoint {
  id: string;
  workspaceId: string;
  timestamp: number;
  data: any;
  metadata: CheckpointMetadata;
}

export interface CheckpointMetadata {
  version: string;
  description: string;
  fileCount: number;
  dataSize: number;
  checksum: string;
}

export interface DataSchema {
  type: string;
  properties: Record<string, SchemaProperty>;
  required: string[];
  version: string;
}

export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  format?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'range' | 'custom';
  value?: any;
  message: string;
}

export class DataIntegrityManager {
  private checkpoints: Map<string, Checkpoint[]>;
  private schemas: Map<string, DataSchema>;
  private maxCheckpoints: number = 10;

  constructor() {
    this.checkpoints = new Map();
    this.schemas = new Map();
    this.initializeSchemas();
  }

  async validateDataTransfer(source: any, target: any, data: any): Promise<ValidationResult> {
    const sourceSchema = await this.getDataSchema(source);
    const targetSchema = await this.getDataSchema(target);
    
    return this.validateTransformation(data, sourceSchema, targetSchema);
  }

  async validateWorkspaceData(workspace: Workspace): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate workspace structure
    if (!workspace.id) {
      errors.push({
        field: 'id',
        message: 'Workspace ID is required',
        code: 'MISSING_ID',
        severity: 'error'
      });
    }

    if (!workspace.name || workspace.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Workspace name is required',
        code: 'MISSING_NAME',
        severity: 'error'
      });
    }

    // Validate file references
    for (const file of workspace.files) {
      const fileValidation = await this.validateFileReference(file);
      errors.push(...fileValidation.errors);
      warnings.push(...fileValidation.warnings);
    }

    // Check for data consistency
    const consistencyCheck = await this.checkDataConsistency(workspace);
    errors.push(...consistencyCheck.errors);
    warnings.push(...consistencyCheck.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async validateFileReference(file: FileReference): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic validation
    if (!file.id) {
      errors.push({
        field: 'id',
        message: 'File ID is required',
        code: 'MISSING_FILE_ID',
        severity: 'error'
      });
    }

    if (!file.name) {
      errors.push({
        field: 'name',
        message: 'File name is required',
        code: 'MISSING_FILE_NAME',
        severity: 'error'
      });
    }

    if (!file.type) {
      errors.push({
        field: 'type',
        message: 'File type is required',
        code: 'MISSING_FILE_TYPE',
        severity: 'error'
      });
    }

    // Size validation
    if (file.size < 0) {
      errors.push({
        field: 'size',
        message: 'File size cannot be negative',
        code: 'INVALID_FILE_SIZE',
        severity: 'error'
      });
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      warnings.push({
        field: 'size',
        message: 'File size exceeds recommended limit of 100MB',
        suggestion: 'Consider compressing the file or using a different format'
      });
    }

    // URL validation
    if (file.url && !this.isValidUrl(file.url)) {
      errors.push({
        field: 'url',
        message: 'Invalid file URL format',
        code: 'INVALID_URL',
        severity: 'error'
      });
    }

    // Metadata validation
    if (file.metadata) {
      const metadataValidation = this.validateMetadata(file.metadata, file.type);
      errors.push(...metadataValidation.errors);
      warnings.push(...metadataValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async createCheckpoint(workspaceId: string, description: string = 'Auto checkpoint'): Promise<Checkpoint> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const checkpointData = this.serializeWorkspace(workspace);
    const checksum = await this.calculateChecksum(checkpointData);

    const checkpoint: Checkpoint = {
      id: this.generateCheckpointId(),
      workspaceId,
      timestamp: Date.now(),
      data: checkpointData,
      metadata: {
        version: '1.0',
        description,
        fileCount: workspace.files.length,
        dataSize: JSON.stringify(checkpointData).length,
        checksum
      }
    };

    // Store checkpoint
    const workspaceCheckpoints = this.checkpoints.get(workspaceId) || [];
    workspaceCheckpoints.push(checkpoint);

    // Keep only the most recent checkpoints
    if (workspaceCheckpoints.length > this.maxCheckpoints) {
      workspaceCheckpoints.splice(0, workspaceCheckpoints.length - this.maxCheckpoints);
    }

    this.checkpoints.set(workspaceId, workspaceCheckpoints);

    // Persist to storage
    await this.persistCheckpoint(checkpoint);

    return checkpoint;
  }

  async restoreCheckpoint(checkpointId: string): Promise<Workspace> {
    const checkpoint = await this.getCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    // Verify data integrity
    const currentChecksum = await this.calculateChecksum(checkpoint.data);
    if (currentChecksum !== checkpoint.metadata.checksum) {
      throw new Error('Checkpoint data integrity check failed');
    }

    return this.deserializeWorkspace(checkpoint.data);
  }

  async validateTransformation(data: any, sourceSchema: DataSchema, targetSchema: DataSchema): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if transformation is possible
    if (!this.isTransformationCompatible(sourceSchema, targetSchema)) {
      errors.push({
        field: 'schema',
        message: `Cannot transform from ${sourceSchema.type} to ${targetSchema.type}`,
        code: 'INCOMPATIBLE_TRANSFORMATION',
        severity: 'error'
      });
    }

    // Validate source data against source schema
    const sourceValidation = this.validateAgainstSchema(data, sourceSchema);
    errors.push(...sourceValidation.errors);

    // Check for potential data loss
    const dataLossCheck = this.checkForDataLoss(sourceSchema, targetSchema);
    warnings.push(...dataLossCheck);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async getDataSchema(tool: any): Promise<DataSchema> {
    const toolId = typeof tool === 'string' ? tool : tool.id;
    return this.schemas.get(toolId) || this.getDefaultSchema();
  }

  private validateAgainstSchema(data: any, schema: DataSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields
    for (const requiredField of schema.required) {
      if (!(requiredField in data) || data[requiredField] === null || data[requiredField] === undefined) {
        errors.push({
          field: requiredField,
          message: `Required field '${requiredField}' is missing`,
          code: 'MISSING_REQUIRED_FIELD',
          severity: 'error'
        });
      }
    }

    // Validate properties
    for (const [fieldName, property] of Object.entries(schema.properties)) {
      if (fieldName in data) {
        const fieldValidation = this.validateProperty(data[fieldName], property, fieldName);
        errors.push(...fieldValidation.errors);
        warnings.push(...fieldValidation.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateProperty(value: any, property: SchemaProperty, fieldName: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Type validation
    if (!this.isCorrectType(value, property.type)) {
      errors.push({
        field: fieldName,
        message: `Expected ${property.type}, got ${typeof value}`,
        code: 'TYPE_MISMATCH',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }

    // Apply validation rules
    if (property.validation) {
      for (const rule of property.validation) {
        const ruleResult = this.applyValidationRule(value, rule, fieldName);
        if (!ruleResult.isValid) {
          errors.push(...ruleResult.errors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private applyValidationRule(value: any, rule: ValidationRule, fieldName: string): ValidationResult {
    const errors: ValidationError[] = [];

    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          errors.push({
            field: fieldName,
            message: rule.message,
            code: 'VALIDATION_FAILED',
            severity: 'error'
          });
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          errors.push({
            field: fieldName,
            message: rule.message,
            code: 'MIN_LENGTH_VIOLATION',
            severity: 'error'
          });
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          errors.push({
            field: fieldName,
            message: rule.message,
            code: 'MAX_LENGTH_VIOLATION',
            severity: 'error'
          });
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
          errors.push({
            field: fieldName,
            message: rule.message,
            code: 'PATTERN_MISMATCH',
            severity: 'error'
          });
        }
        break;

      case 'range':
        if (typeof value === 'number' && (value < rule.value.min || value > rule.value.max)) {
          errors.push({
            field: fieldName,
            message: rule.message,
            code: 'RANGE_VIOLATION',
            severity: 'error'
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private async checkDataConsistency(workspace: Workspace): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for duplicate file IDs
    const fileIds = new Set();
    for (const file of workspace.files) {
      if (fileIds.has(file.id)) {
        errors.push({
          field: 'files',
          message: `Duplicate file ID: ${file.id}`,
          code: 'DUPLICATE_FILE_ID',
          severity: 'error'
        });
      }
      fileIds.add(file.id);
    }

    // Check file reference integrity
    for (const file of workspace.files) {
      if (file.url && !(await this.verifyFileExists(file.url))) {
        warnings.push({
          field: 'files',
          message: `File not accessible: ${file.name}`,
          suggestion: 'Check if the file URL is still valid'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateMetadata(metadata: any, fileType: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Type-specific metadata validation
    if (fileType.startsWith('image/')) {
      if (metadata.dimensions) {
        if (!metadata.dimensions.width || !metadata.dimensions.height) {
          warnings.push({
            field: 'metadata.dimensions',
            message: 'Image dimensions are incomplete',
            suggestion: 'Ensure both width and height are specified'
          });
        }
      }
    }

    if (fileType.startsWith('video/') || fileType.startsWith('audio/')) {
      if (metadata.duration && metadata.duration < 0) {
        errors.push({
          field: 'metadata.duration',
          message: 'Media duration cannot be negative',
          code: 'INVALID_DURATION',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isCorrectType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  private isTransformationCompatible(sourceSchema: DataSchema, targetSchema: DataSchema): boolean {
    // Define compatibility matrix
    const compatibilityMatrix: Record<string, string[]> = {
      'image': ['image', 'document'],
      'document': ['document', 'text'],
      'code': ['code', 'text', 'document'],
      'audio': ['audio', 'media'],
      'video': ['video', 'media', 'audio']
    };

    const compatibleTypes = compatibilityMatrix[sourceSchema.type] || [];
    return compatibleTypes.includes(targetSchema.type);
  }

  private checkForDataLoss(sourceSchema: DataSchema, targetSchema: DataSchema): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check if target schema has fewer properties
    const sourceProps = Object.keys(sourceSchema.properties);
    const targetProps = Object.keys(targetSchema.properties);

    for (const sourceProp of sourceProps) {
      if (!targetProps.includes(sourceProp)) {
        warnings.push({
          field: sourceProp,
          message: `Property '${sourceProp}' will be lost in transformation`,
          suggestion: 'Consider using a different target format or manually preserve this data'
        });
      }
    }

    return warnings;
  }

  private async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    // This would typically fetch from storage
    // For now, return null as placeholder
    return null;
  }

  private serializeWorkspace(workspace: Workspace): any {
    return JSON.parse(JSON.stringify(workspace));
  }

  private deserializeWorkspace(data: any): Workspace {
    return data as Workspace;
  }

  private async calculateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateCheckpointId(): string {
    return `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async persistCheckpoint(checkpoint: Checkpoint): Promise<void> {
    // Store in IndexedDB or localStorage
    const key = `checkpoint_${checkpoint.id}`;
    localStorage.setItem(key, JSON.stringify(checkpoint));
  }

  private async getCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
    const key = `checkpoint_${checkpointId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private async verifyFileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getDefaultSchema(): DataSchema {
    return {
      type: 'object',
      properties: {},
      required: [],
      version: '1.0'
    };
  }

  private initializeSchemas(): void {
    // Image schema
    this.schemas.set('image', {
      type: 'image',
      properties: {
        data: { type: 'string', validation: [{ type: 'required', message: 'Image data is required' }] },
        format: { type: 'string', validation: [{ type: 'required', message: 'Image format is required' }] },
        dimensions: { type: 'object' },
        colorProfile: { type: 'string' }
      },
      required: ['data', 'format'],
      version: '1.0'
    });

    // Document schema
    this.schemas.set('document', {
      type: 'document',
      properties: {
        content: { type: 'string', validation: [{ type: 'required', message: 'Document content is required' }] },
        format: { type: 'string', validation: [{ type: 'required', message: 'Document format is required' }] },
        metadata: { type: 'object' }
      },
      required: ['content', 'format'],
      version: '1.0'
    });

    // Code schema
    this.schemas.set('code', {
      type: 'code',
      properties: {
        source: { type: 'string', validation: [{ type: 'required', message: 'Source code is required' }] },
        language: { type: 'string', validation: [{ type: 'required', message: 'Programming language is required' }] },
        dependencies: { type: 'array' }
      },
      required: ['source', 'language'],
      version: '1.0'
    });
  }

  getCheckpoints(workspaceId: string): Checkpoint[] {
    return this.checkpoints.get(workspaceId) || [];
  }

  async deleteCheckpoint(checkpointId: string): Promise<void> {
    // Remove from memory
    for (const [workspaceId, checkpoints] of this.checkpoints.entries()) {
      const index = checkpoints.findIndex(cp => cp.id === checkpointId);
      if (index !== -1) {
        checkpoints.splice(index, 1);
        break;
      }
    }

    // Remove from storage
    const key = `checkpoint_${checkpointId}`;
    localStorage.removeItem(key);
  }
}