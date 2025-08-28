import { DataIntegrityManager } from '@/services/DataIntegrityManager';
import { Workspace } from '@/types/workspace';
import { FileReference } from '@/types/file';

// Mock crypto.subtle for testing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

describe('DataIntegrityManager', () => {
  let dataIntegrityManager: DataIntegrityManager;

  beforeEach(() => {
    dataIntegrityManager = new DataIntegrityManager();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateWorkspaceData', () => {
    it('should validate a correct workspace', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: WorkspaceType.CREATIVE_STUDIO,
        created: new Date(),
        lastModified: new Date(),
        files: [],
        activeTools: [],
        snapshots: [],
        stats: {
          totalFiles: 0,
          totalSize: 0,
          toolsUsed: [],
          lastActivity: new Date(),
          collaboratorCount: 0,
          snapshotCount: 0
        },
        isPublic: false,
        tags: [],
        childWorkspaceIds: [],
        settings: {
          theme: 'light',
          autoSave: true,
          autoSaveInterval: 30000,
          maxFileSize: 10000000,
          enableCollaboration: false,
          enableOfflineMode: false,
          preferredTools: {},
          customShortcuts: {},
          privacy: {
            allowAnalytics: false,
            allowCrashReporting: false,
            shareUsageData: false
          }
        },
        configuration: {
          theme: 'light',
          autoSave: true,
          autoSaveInterval: 30000,
          maxFileSize: 10000000,
          enableCollaboration: false,
          enableOfflineMode: false,
          preferredTools: {},
          customShortcuts: {},
          privacy: {
            allowAnalytics: false,
            allowCrashReporting: false,
            shareUsageData: false
          }
        }
      };

      const result = await dataIntegrityManager.validateWorkspaceData(workspace);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing workspace ID', async () => {
      const workspace = {
        name: 'Test Workspace',
        type: WorkspaceType.CREATIVE_STUDIO,
        created: new Date(),
        lastModified: new Date(),
        files: [],
        activeTools: [],
        snapshots: [],
        stats: {
          totalFiles: 0,
          totalSize: 0,
          toolsUsed: [],
          lastActivity: new Date(),
          collaboratorCount: 0,
          snapshotCount: 0
        },
        isPublic: false,
        tags: [],
        childWorkspaceIds: [],
        settings: {
          theme: 'light',
          autoSave: true,
          autoSaveInterval: 30000,
          maxFileSize: 10000000,
          enableCollaboration: false,
          enableOfflineMode: false,
          preferredTools: {},
          customShortcuts: {},
          privacy: {
            allowAnalytics: false,
            allowCrashReporting: false,
            shareUsageData: false
          }
        }
      } as Workspace;

      const result = await dataIntegrityManager.validateWorkspaceData(workspace);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_ID');
    });

    it('should detect missing workspace name', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: '',
        type: WorkspaceType.CREATIVE_STUDIO,
        created: new Date(),
        lastModified: new Date(),
        files: [],
        activeTools: [],
        snapshots: [],
        stats: {
          totalFiles: 0,
          totalSize: 0,
          toolsUsed: [],
          lastActivity: new Date(),
          collaboratorCount: 0,
          snapshotCount: 0
        },
        isPublic: false,
        tags: [],
        childWorkspaceIds: [],
        settings: {
          theme: 'light',
          autoSave: true,
          autoSaveInterval: 30000,
          maxFileSize: 10000000,
          enableCollaboration: false,
          enableOfflineMode: false,
          preferredTools: {},
          customShortcuts: {},
          privacy: {
            allowAnalytics: false,
            allowCrashReporting: false,
            shareUsageData: false
          }
        },
        configuration: {
          theme: 'light',
          autoSave: true,
          autoSaveInterval: 30000,
          maxFileSize: 10000000,
          enableCollaboration: false,
          enableOfflineMode: false,
          preferredTools: {},
          customShortcuts: {},
          privacy: {
            allowAnalytics: false,
            allowCrashReporting: false,
            shareUsageData: false
          }
        }
      };

      const result = await dataIntegrityManager.validateWorkspaceData(workspace);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_NAME');
    });

    it('should detect duplicate file IDs', async () => {
      const file1: FileReference = {
        id: 'duplicate-id',
        name: 'file1.txt',
        originalName: 'file1.txt',
        type: 'text/plain',
        size: 100,
        url: 'blob:test1',
        metadata: {
          customProperties: {}
        },
        versions: [],
        permissions: { 
          canRead: true, 
          canWrite: true, 
          canDelete: true,
          canShare: true,
          canDownload: true
        },
        tags: [],
        workspaceId: 'test-workspace',
        childFileIds: [],
        isTemporary: false,
        source: FileSource.UPLOAD,
        processingStatus: FileProcessingStatus.COMPLETED,
        downloadCount: 0,
        lastAccessed: new Date(),
        created: new Date(),
        lastModified: new Date()
      };

      const file2: FileReference = {
        id: 'duplicate-id',
        name: 'file2.txt',
        originalName: 'file2.txt',
        type: 'text/plain',
        size: 200,
        url: 'blob:test2',
        metadata: {
          customProperties: {}
        },
        versions: [],
        permissions: { 
          canRead: true, 
          canWrite: true, 
          canDelete: true,
          canShare: true,
          canDownload: true
        },
        tags: [],
        workspaceId: 'test-workspace',
        childFileIds: [],
        isTemporary: false,
        source: FileSource.UPLOAD,
        processingStatus: FileProcessingStatus.COMPLETED,
        downloadCount: 0,
        lastAccessed: new Date(),
        created: new Date(),
        lastModified: new Date()
      };

      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: WorkspaceType.CREATIVE_STUDIO,
        created: new Date(),
        lastModified: new Date(),
        files: [file1, file2],
        activeTools: [],
        snapshots: [],
        stats: {
          totalFiles: 0,
          totalSize: 0,
          toolsUsed: [],
          lastActivity: new Date(),
          collaboratorCount: 0,
          snapshotCount: 0
        },
        isPublic: false,
        tags: [],
        childWorkspaceIds: [],
        settings: {
          theme: 'light',
          autoSave: true,
          autoSaveInterval: 30000,
          maxFileSize: 10000000,
          enableCollaboration: false,
          enableOfflineMode: false,
          preferredTools: {},
          customShortcuts: {},
          privacy: {
            allowAnalytics: false,
            allowCrashReporting: false,
            shareUsageData: false
          }
        },
        configuration: {
          theme: 'light',
          autoSave: true,
          autoSaveInterval: 30000,
          maxFileSize: 10000000,
          enableCollaboration: false,
          enableOfflineMode: false,
          preferredTools: {},
          customShortcuts: {},
          privacy: {
            allowAnalytics: false,
            allowCrashReporting: false,
            shareUsageData: false
          }
        }
      };

      const result = await dataIntegrityManager.validateWorkspaceData(workspace);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_FILE_ID')).toBe(true);
    });
  });

  describe('validateFileReference', () => {
    it('should validate a correct file reference', async () => {
      const file: FileReference = {
        id: 'test-file',
        name: 'test.txt',
        type: 'text/plain',
        size: 1024,
        url: 'https://example.com/test.txt',
        metadata: {},
        versions: [],
        permissions: { read: true, write: true, delete: true }
      };

      const result = await dataIntegrityManager.validateFileReference(file);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing file ID', async () => {
      const file = {
        name: 'test.txt',
        type: 'text/plain',
        size: 1024,
        url: 'https://example.com/test.txt',
        metadata: {},
        versions: [],
        permissions: { read: true, write: true, delete: true }
      } as FileReference;

      const result = await dataIntegrityManager.validateFileReference(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_FILE_ID')).toBe(true);
    });

    it('should detect negative file size', async () => {
      const file: FileReference = {
        id: 'test-file',
        name: 'test.txt',
        type: 'text/plain',
        size: -100,
        url: 'https://example.com/test.txt',
        metadata: {},
        versions: [],
        permissions: { read: true, write: true, delete: true }
      };

      const result = await dataIntegrityManager.validateFileReference(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_FILE_SIZE')).toBe(true);
    });

    it('should warn about large file size', async () => {
      const file: FileReference = {
        id: 'test-file',
        name: 'large-file.zip',
        type: 'application/zip',
        size: 150 * 1024 * 1024, // 150MB
        url: 'https://example.com/large-file.zip',
        metadata: {},
        versions: [],
        permissions: { read: true, write: true, delete: true }
      };

      const result = await dataIntegrityManager.validateFileReference(file);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('exceeds recommended limit');
    });

    it('should detect invalid URL format', async () => {
      const file: FileReference = {
        id: 'test-file',
        name: 'test.txt',
        type: 'text/plain',
        size: 1024,
        url: 'invalid-url',
        metadata: {},
        versions: [],
        permissions: { read: true, write: true, delete: true }
      };

      const result = await dataIntegrityManager.validateFileReference(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_URL')).toBe(true);
    });
  });

  describe('checkpoint management', () => {
    it('should create a checkpoint', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: 'creative-studio',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      // Mock getWorkspace method
      jest.spyOn(dataIntegrityManager as any, 'getWorkspace').mockResolvedValue(workspace);

      const checkpoint = await dataIntegrityManager.createCheckpoint('test-workspace', 'Test checkpoint');

      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.workspaceId).toBe('test-workspace');
      expect(checkpoint.metadata.description).toBe('Test checkpoint');
      expect(checkpoint.metadata.fileCount).toBe(0);
    });

    it('should restore from checkpoint', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: 'creative-studio',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      // Mock getWorkspace and checkpoint methods
      jest.spyOn(dataIntegrityManager as any, 'getWorkspace').mockResolvedValue(workspace);
      
      const checkpoint = await dataIntegrityManager.createCheckpoint('test-workspace');
      const restored = await dataIntegrityManager.restoreCheckpoint(checkpoint.id);

      expect(restored.id).toBe(workspace.id);
      expect(restored.name).toBe(workspace.name);
    });

    it('should detect corrupted checkpoint data', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: 'creative-studio',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      jest.spyOn(dataIntegrityManager as any, 'getWorkspace').mockResolvedValue(workspace);
      
      const checkpoint = await dataIntegrityManager.createCheckpoint('test-workspace');
      
      // Corrupt the checkpoint data
      checkpoint.data.corrupted = true;

      await expect(dataIntegrityManager.restoreCheckpoint(checkpoint.id))
        .rejects.toThrow('Checkpoint data integrity check failed');
    });

    it('should limit number of checkpoints', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: 'creative-studio',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      jest.spyOn(dataIntegrityManager as any, 'getWorkspace').mockResolvedValue(workspace);

      // Create 12 checkpoints (more than the limit of 10)
      for (let i = 0; i < 12; i++) {
        await dataIntegrityManager.createCheckpoint('test-workspace', `Checkpoint ${i}`);
      }

      const checkpoints = dataIntegrityManager.getCheckpoints('test-workspace');
      expect(checkpoints).toHaveLength(10);
      expect(checkpoints[0].metadata.description).toBe('Checkpoint 2'); // First two should be removed
    });

    it('should delete checkpoint', async () => {
      const workspace: Workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        type: 'creative-studio',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      jest.spyOn(dataIntegrityManager as any, 'getWorkspace').mockResolvedValue(workspace);
      
      const checkpoint = await dataIntegrityManager.createCheckpoint('test-workspace');
      expect(dataIntegrityManager.getCheckpoints('test-workspace')).toHaveLength(1);

      await dataIntegrityManager.deleteCheckpoint(checkpoint.id);
      expect(dataIntegrityManager.getCheckpoints('test-workspace')).toHaveLength(0);
    });
  });

  describe('data transformation validation', () => {
    it('should validate compatible transformations', async () => {
      const sourceData = { content: 'test', format: 'text' };
      const sourceSchema = {
        type: 'document',
        properties: {
          content: { type: 'string' as const },
          format: { type: 'string' as const }
        },
        required: ['content', 'format'],
        version: '1.0'
      };
      const targetSchema = {
        type: 'document',
        properties: {
          content: { type: 'string' as const },
          format: { type: 'string' as const }
        },
        required: ['content'],
        version: '1.0'
      };

      const result = await dataIntegrityManager.validateTransformation(sourceData, sourceSchema, targetSchema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect incompatible transformations', async () => {
      const sourceData = { content: 'test' };
      const sourceSchema = {
        type: 'audio',
        properties: { content: { type: 'string' as const } },
        required: ['content'],
        version: '1.0'
      };
      const targetSchema = {
        type: 'image',
        properties: { data: { type: 'string' as const } },
        required: ['data'],
        version: '1.0'
      };

      const result = await dataIntegrityManager.validateTransformation(sourceData, sourceSchema, targetSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INCOMPATIBLE_TRANSFORMATION')).toBe(true);
    });

    it('should warn about potential data loss', async () => {
      const sourceData = { content: 'test', metadata: 'extra data' };
      const sourceSchema = {
        type: 'document',
        properties: {
          content: { type: 'string' as const },
          metadata: { type: 'string' as const }
        },
        required: ['content'],
        version: '1.0'
      };
      const targetSchema = {
        type: 'document',
        properties: {
          content: { type: 'string' as const }
        },
        required: ['content'],
        version: '1.0'
      };

      const result = await dataIntegrityManager.validateTransformation(sourceData, sourceSchema, targetSchema);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('will be lost'))).toBe(true);
    });
  });
});