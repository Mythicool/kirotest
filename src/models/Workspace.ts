import { 
  Workspace as IWorkspace, 
  WorkspaceType, 
  WorkspaceSettings, 
  WorkspaceFilter,
  WorkspaceSortOptions,
  WorkspaceSnapshot,
  WorkspaceStats,
  Collaborator
} from '../types/workspace';
import { FileReference } from '../types/file';
import { ActiveTool } from '../types/tool';
import { UUID } from '../types/common';

export class Workspace implements IWorkspace {
  id: UUID;
  name: string;
  description?: string;
  type: WorkspaceType;
  created: Date;
  lastModified: Date;
  files: FileReference[];
  activeTools: ActiveTool[];
  collaborators?: Collaborator[];
  snapshots: WorkspaceSnapshot[];
  stats: WorkspaceStats;
  isPublic: boolean;
  shareUrl?: string;
  tags: string[];
  parentWorkspaceId?: UUID;
  childWorkspaceIds: UUID[];
  configuration: WorkspaceSettings;

  constructor(data: Partial<IWorkspace> & { name: string; type: WorkspaceType }) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.created = data.created || new Date();
    this.lastModified = data.lastModified || new Date();
    this.files = data.files || [];
    this.activeTools = data.activeTools || [];
    this.collaborators = data.collaborators;
    this.snapshots = data.snapshots || [];
    this.stats = data.stats || this.initializeStats();
    this.isPublic = data.isPublic || false;
    this.shareUrl = data.shareUrl;
    this.tags = data.tags || [];
    this.parentWorkspaceId = data.parentWorkspaceId;
    this.childWorkspaceIds = data.childWorkspaceIds || [];
    this.configuration = data.configuration || this.getDefaultSettings();
  }

  private generateId(): UUID {
    return `workspace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getDefaultSettings(): WorkspaceSettings {
    return {
      theme: 'auto',
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      maxFileSize: 100 * 1024 * 1024, // 100MB
      enableCollaboration: false,
      enableOfflineMode: true,
      preferredTools: {},
      customShortcuts: {},
      privacy: {
        allowAnalytics: false,
        allowCrashReporting: true,
        shareUsageData: false
      }
    };
  }

  private initializeStats(): WorkspaceStats {
    return {
      totalFiles: 0,
      totalSize: 0,
      toolsUsed: [],
      lastActivity: new Date(),
      collaboratorCount: 0,
      snapshotCount: 0
    };
  }

  // CRUD Operations
  static async create(data: { name: string; type: WorkspaceType } & Partial<IWorkspace>): Promise<Workspace> {
    const workspace = new Workspace(data);
    await workspace.save();
    return workspace;
  }

  static async findById(id: UUID): Promise<Workspace | null> {
    try {
      const data = localStorage.getItem(`workspace_${id}`);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return new Workspace({
        ...parsed,
        created: new Date(parsed.created),
        lastModified: new Date(parsed.lastModified)
      });
    } catch (error) {
      console.error('Error loading workspace:', error);
      return null;
    }
  }

  static async findAll(filter?: WorkspaceFilter, sort?: WorkspaceSortOptions): Promise<Workspace[]> {
    const workspaces: Workspace[] = [];
    
    // Get all workspace keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('workspace_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            const workspace = new Workspace({
              ...parsed,
              created: new Date(parsed.created),
              lastModified: new Date(parsed.lastModified)
            });
            
            if (this.matchesFilter(workspace, filter)) {
              workspaces.push(workspace);
            }
          }
        } catch (error) {
          console.error(`Error loading workspace from key ${key}:`, error);
        }
      }
    }

    // Apply sorting
    if (sort) {
      workspaces.sort((a, b) => {
        const aValue = this.getSortValue(a, sort.field);
        const bValue = this.getSortValue(b, sort.field);
        
        if (sort.direction === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    return workspaces;
  }

  private static matchesFilter(workspace: Workspace, filter?: WorkspaceFilter): boolean {
    if (!filter) return true;

    if (filter.type && workspace.type !== filter.type) return false;
    if (filter.isPublic !== undefined && workspace.isPublic !== filter.isPublic) return false;
    if (filter.hasFiles !== undefined && (workspace.files.length > 0) !== filter.hasFiles) return false;
    
    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some(tag => workspace.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matchesName = workspace.name.toLowerCase().includes(query);
      const matchesDescription = workspace.description?.toLowerCase().includes(query);
      const matchesTags = workspace.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesName && !matchesDescription && !matchesTags) return false;
    }

    if (filter.dateRange) {
      const created = workspace.created.getTime();
      const start = filter.dateRange.start.getTime();
      const end = filter.dateRange.end.getTime();
      
      if (created < start || created > end) return false;
    }

    return true;
  }

  private static getSortValue(workspace: Workspace, field: string): any {
    switch (field) {
      case 'name': return workspace.name.toLowerCase();
      case 'created': return workspace.created.getTime();
      case 'lastModified': return workspace.lastModified.getTime();
      case 'fileCount': return workspace.files.length;
      case 'size': return workspace.stats.totalSize;
      default: return workspace.name.toLowerCase();
    }
  }

  async save(): Promise<void> {
    this.lastModified = new Date();
    this.updateStats();
    
    try {
      const data = {
        ...this,
        created: this.created.toISOString(),
        lastModified: this.lastModified.toISOString()
      };
      
      localStorage.setItem(`workspace_${this.id}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving workspace:', error);
      throw new Error('Failed to save workspace');
    }
  }

  async delete(): Promise<void> {
    try {
      localStorage.removeItem(`workspace_${this.id}`);
      
      // Also remove any associated snapshots
      this.snapshots.forEach(snapshot => {
        localStorage.removeItem(`snapshot_${snapshot.id}`);
      });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw new Error('Failed to delete workspace');
    }
  }

  async duplicate(newName?: string): Promise<Workspace> {
    const duplicateData = {
      ...this,
      id: undefined, // Will generate new ID
      name: newName || `${this.name} (Copy)`,
      created: undefined, // Will use current date
      lastModified: undefined, // Will use current date
      snapshots: [], // Don't copy snapshots
      shareUrl: undefined, // Don't copy share URL
      collaborators: undefined // Don't copy collaborators
    };

    return Workspace.create(duplicateData);
  }

  // File management
  addFile(file: FileReference): void {
    if (!this.files.find(f => f.id === file.id)) {
      this.files.push(file);
      this.updateStats();
    }
  }

  removeFile(fileId: UUID): boolean {
    const index = this.files.findIndex(f => f.id === fileId);
    if (index !== -1) {
      this.files.splice(index, 1);
      this.updateStats();
      return true;
    }
    return false;
  }

  getFile(fileId: UUID): FileReference | undefined {
    return this.files.find(f => f.id === fileId);
  }

  // Tool management
  addActiveTool(tool: ActiveTool): void {
    const existingIndex = this.activeTools.findIndex(t => t.instanceId === tool.instanceId);
    if (existingIndex !== -1) {
      this.activeTools[existingIndex] = tool;
    } else {
      this.activeTools.push(tool);
    }
    this.updateToolsUsed();
  }

  removeActiveTool(instanceId: UUID): boolean {
    const index = this.activeTools.findIndex(t => t.instanceId === instanceId);
    if (index !== -1) {
      this.activeTools.splice(index, 1);
      return true;
    }
    return false;
  }

  getActiveTool(instanceId: UUID): ActiveTool | undefined {
    return this.activeTools.find(t => t.instanceId === instanceId);
  }

  // Snapshot management
  async createSnapshot(name: string, description?: string): Promise<WorkspaceSnapshot> {
    const snapshot: WorkspaceSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: this.id,
      name,
      description,
      created: new Date(),
      fileCount: this.files.length,
      totalSize: this.stats.totalSize,
      metadata: {
        activeTools: this.activeTools.map(t => t.toolId),
        settings: { ...this.configuration }
      }
    };

    // Save snapshot data
    try {
      const snapshotData = {
        ...snapshot,
        workspaceData: {
          name: this.name,
          description: this.description,
          files: this.files,
          activeTools: this.activeTools,
          configuration: this.configuration
        }
      };
      
      localStorage.setItem(`snapshot_${snapshot.id}`, JSON.stringify(snapshotData));
      this.snapshots.push(snapshot);
      this.updateStats();
      await this.save();
      
      return snapshot;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw new Error('Failed to create snapshot');
    }
  }

  async restoreSnapshot(snapshotId: UUID): Promise<void> {
    try {
      const snapshotData = localStorage.getItem(`snapshot_${snapshotId}`);
      if (!snapshotData) {
        throw new Error('Snapshot not found');
      }

      const parsed = JSON.parse(snapshotData);
      if (parsed.workspaceId !== this.id) {
        throw new Error('Snapshot does not belong to this workspace');
      }



      // Restore workspace data from snapshot
      this.files = parsed.workspaceData.files || [];
      this.activeTools = parsed.workspaceData.activeTools || [];
      this.configuration = parsed.workspaceData.configuration || this.getDefaultSettings();
      
      // Restore name and description if they were saved in the snapshot
      if (parsed.workspaceData.name) {
        this.name = parsed.workspaceData.name;
      }
      if (parsed.workspaceData.description) {
        this.description = parsed.workspaceData.description;
      }
      
      this.updateStats();
      await this.save();
    } catch (error) {
      console.error('Error restoring snapshot:', error);
      throw new Error('Failed to restore snapshot');
    }
  }

  // Settings management
  updateSettings(settings: Partial<WorkspaceSettings>): void {
    this.configuration = { ...this.configuration, ...settings };
  }

  // Statistics and maintenance
  private updateStats(): void {
    this.stats.totalFiles = this.files.length;
    this.stats.totalSize = this.files.reduce((total, file) => total + file.size, 0);
    this.stats.lastActivity = new Date();
    this.stats.collaboratorCount = this.collaborators?.length || 0;
    this.stats.snapshotCount = this.snapshots.length;
  }

  private updateToolsUsed(): void {
    const toolIds = new Set(this.activeTools.map(t => t.toolId));
    this.stats.toolsUsed = Array.from(toolIds);
  }

  // Serialization
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      created: this.created.toISOString(),
      lastModified: this.lastModified.toISOString(),
      files: this.files,
      activeTools: this.activeTools,
      collaborators: this.collaborators,
      snapshots: this.snapshots,
      stats: this.stats,
      isPublic: this.isPublic,
      shareUrl: this.shareUrl,
      tags: this.tags,
      parentWorkspaceId: this.parentWorkspaceId,
      childWorkspaceIds: this.childWorkspaceIds,
      configuration: this.configuration
    };
  }
}