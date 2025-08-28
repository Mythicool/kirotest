import { Workspace } from './Workspace';
import { ToolIntegration } from './ToolIntegration';
import { 
  UUID, 
  NetworkStatus,
  ErrorInfo 
} from '../types/common';
import { 
  ToolRegistry,
  ActiveTool,
  ToolHealthStatus,
  ToolUsageStats 
} from '../types/tool';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  autoSave: boolean;
  autoSaveInterval: number;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  privacy: {
    allowAnalytics: boolean;
    allowCrashReporting: boolean;
    shareUsageData: boolean;
  };
  performance: {
    enableAnimations: boolean;
    lazyLoading: boolean;
    cacheSize: number;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  size: number; // Size in bytes
}

export interface CacheManager {
  entries: Map<string, CacheEntry>;
  maxSize: number;
  currentSize: number;
}

export interface ApplicationState {
  user: UserPreferences;
  workspaces: UUID[];
  activeWorkspaceId?: UUID;
  tools: ToolRegistry;
  cache: CacheManager;
  network: NetworkStatus;
  errors: ErrorInfo[];
  lastSync: Date;
  version: string;
}

export class StateManager {
  private static instance: StateManager;
  private state: ApplicationState;
  private listeners: Map<string, Set<(state: ApplicationState) => void>>;
  private persistenceKey = 'app_state';
  private autoSaveInterval: number = 30000; // 30 seconds
  private autoSaveTimer?: NodeJS.Timeout;

  private constructor() {
    this.state = this.getInitialState();
    this.listeners = new Map();
    this.startAutoSave();
    this.setupStorageListener();
  }

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  private getInitialState(): ApplicationState {
    return {
      user: this.getDefaultUserPreferences(),
      workspaces: [],
      activeWorkspaceId: undefined,
      tools: {
        tools: new Map(),
        activeTools: new Map(),
        healthStatus: new Map(),
        usageStats: new Map()
      },
      cache: {
        entries: new Map(),
        maxSize: 50 * 1024 * 1024, // 50MB
        currentSize: 0
      },
      network: {
        online: navigator.onLine,
        connectionType: 'unknown'
      },
      errors: [],
      lastSync: new Date(),
      version: '1.0.0'
    };
  }

  private getDefaultUserPreferences(): UserPreferences {
    return {
      theme: 'auto',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      autoSave: true,
      autoSaveInterval: 30000,
      notifications: {
        enabled: true,
        sound: true,
        desktop: false,
        email: false
      },
      privacy: {
        allowAnalytics: false,
        allowCrashReporting: true,
        shareUsageData: false
      },
      performance: {
        enableAnimations: true,
        lazyLoading: true,
        cacheSize: 50 * 1024 * 1024
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
        fontSize: 'medium'
      }
    };
  }

  // State access
  getState(): ApplicationState {
    return { ...this.state };
  }

  getWorkspaces(): UUID[] {
    return [...this.state.workspaces];
  }

  getActiveWorkspaceId(): UUID | undefined {
    return this.state.activeWorkspaceId;
  }

  async getActiveWorkspace(): Promise<Workspace | null> {
    if (!this.state.activeWorkspaceId) return null;
    return await Workspace.findById(this.state.activeWorkspaceId);
  }

  getUserPreferences(): UserPreferences {
    return { ...this.state.user };
  }

  getToolRegistry(): ToolRegistry {
    return {
      tools: new Map(this.state.tools.tools),
      activeTools: new Map(this.state.tools.activeTools),
      healthStatus: new Map(this.state.tools.healthStatus),
      usageStats: new Map(this.state.tools.usageStats)
    };
  }

  getNetworkStatus(): NetworkStatus {
    return { ...this.state.network };
  }

  getErrors(): ErrorInfo[] {
    return [...this.state.errors];
  }

  // State mutations
  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    this.state.user = { ...this.state.user, ...preferences };
    this.notifyListeners('user');
    this.scheduleAutoSave();
  }

  async addWorkspace(workspace: Workspace): Promise<void> {
    if (!this.state.workspaces.includes(workspace.id)) {
      this.state.workspaces.push(workspace.id);
      this.notifyListeners('workspaces');
      this.scheduleAutoSave();
    }
  }

  async removeWorkspace(workspaceId: UUID): Promise<void> {
    const index = this.state.workspaces.indexOf(workspaceId);
    if (index !== -1) {
      this.state.workspaces.splice(index, 1);
      
      // Clear active workspace if it's the one being removed
      if (this.state.activeWorkspaceId === workspaceId) {
        this.state.activeWorkspaceId = undefined;
      }
      
      // Remove associated active tools
      const toolsToRemove: UUID[] = [];
      this.state.tools.activeTools.forEach((tool, instanceId) => {
        if (tool.workspaceId === workspaceId) {
          toolsToRemove.push(instanceId);
        }
      });
      
      toolsToRemove.forEach(instanceId => {
        this.state.tools.activeTools.delete(instanceId);
      });
      
      this.notifyListeners('workspaces');
      this.scheduleAutoSave();
    }
  }

  async setActiveWorkspace(workspaceId: UUID | undefined): Promise<void> {
    if (workspaceId && !this.state.workspaces.includes(workspaceId)) {
      throw new Error('Workspace not found in state');
    }
    
    this.state.activeWorkspaceId = workspaceId;
    this.notifyListeners('activeWorkspace');
    this.scheduleAutoSave();
  }

  // Tool management
  async registerTool(tool: ToolIntegration): Promise<void> {
    this.state.tools.tools.set(tool.id, tool);
    this.notifyListeners('tools');
    this.scheduleAutoSave();
  }

  async unregisterTool(toolId: UUID): Promise<void> {
    this.state.tools.tools.delete(toolId);
    
    // Remove any active instances
    const instancesToRemove: UUID[] = [];
    this.state.tools.activeTools.forEach((tool, instanceId) => {
      if (tool.toolId === toolId) {
        instancesToRemove.push(instanceId);
      }
    });
    
    instancesToRemove.forEach(instanceId => {
      this.state.tools.activeTools.delete(instanceId);
    });
    
    // Remove health status and usage stats
    this.state.tools.healthStatus.delete(toolId);
    this.state.tools.usageStats.delete(toolId);
    
    this.notifyListeners('tools');
    this.scheduleAutoSave();
  }

  async addActiveTool(tool: ActiveTool): Promise<void> {
    this.state.tools.activeTools.set(tool.instanceId, tool);
    this.notifyListeners('activeTools');
    this.scheduleAutoSave();
  }

  async removeActiveTool(instanceId: UUID): Promise<void> {
    this.state.tools.activeTools.delete(instanceId);
    this.notifyListeners('activeTools');
    this.scheduleAutoSave();
  }

  async updateToolHealth(toolId: UUID, health: ToolHealthStatus): Promise<void> {
    this.state.tools.healthStatus.set(toolId, health);
    this.notifyListeners('toolHealth');
  }

  async updateToolUsageStats(toolId: UUID, stats: ToolUsageStats): Promise<void> {
    this.state.tools.usageStats.set(toolId, stats);
    this.notifyListeners('toolStats');
  }

  // Cache management
  setCache<T>(key: string, data: T, ttl: number = 3600000): void { // Default 1 hour TTL
    const size = this.estimateSize(data);
    
    // Remove expired entries and make space if needed
    this.cleanupCache();
    this.makeSpace(size);
    
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: new Date(),
      ttl,
      size
    };
    
    this.state.cache.entries.set(key, entry);
    this.state.cache.currentSize += size;
  }

  getCache<T>(key: string): T | null {
    const entry = this.state.cache.entries.get(key);
    if (!entry) return null;
    
    // Check if expired
    const now = new Date().getTime();
    const entryTime = entry.timestamp.getTime();
    if (now - entryTime > entry.ttl) {
      this.removeCache(key);
      return null;
    }
    
    return entry.data as T;
  }

  removeCache(key: string): boolean {
    const entry = this.state.cache.entries.get(key);
    if (entry) {
      this.state.cache.entries.delete(key);
      this.state.cache.currentSize -= entry.size;
      return true;
    }
    return false;
  }

  clearCache(): void {
    this.state.cache.entries.clear();
    this.state.cache.currentSize = 0;
  }

  private cleanupCache(): void {
    const now = new Date().getTime();
    const expiredKeys: string[] = [];
    
    this.state.cache.entries.forEach((entry, key) => {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.removeCache(key));
  }

  private makeSpace(requiredSize: number): void {
    if (this.state.cache.currentSize + requiredSize <= this.state.cache.maxSize) {
      return;
    }
    
    // Remove oldest entries until we have enough space
    const entries = Array.from(this.state.cache.entries.entries())
      .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());
    
    for (const [key] of entries) {
      this.removeCache(key);
      if (this.state.cache.currentSize + requiredSize <= this.state.cache.maxSize) {
        break;
      }
    }
  }

  private estimateSize(data: any): number {
    // Simple size estimation
    return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
  }

  // Error management
  addError(error: ErrorInfo): void {
    this.state.errors.push(error);
    
    // Keep only last 100 errors
    if (this.state.errors.length > 100) {
      this.state.errors = this.state.errors.slice(-100);
    }
    
    this.notifyListeners('errors');
  }

  clearErrors(): void {
    this.state.errors = [];
    this.notifyListeners('errors');
  }

  removeError(errorCode: string): boolean {
    const index = this.state.errors.findIndex(e => e.code === errorCode);
    if (index !== -1) {
      this.state.errors.splice(index, 1);
      this.notifyListeners('errors');
      return true;
    }
    return false;
  }

  // Network status
  updateNetworkStatus(status: Partial<NetworkStatus>): void {
    this.state.network = { ...this.state.network, ...status };
    this.notifyListeners('network');
  }

  // Event listeners
  subscribe(event: string, callback: (state: ApplicationState) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private notifyListeners(event: string): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(this.getState());
        } catch (error) {
          console.error('Error in state listener:', error);
        }
      });
    }
    
    // Also notify global listeners
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => {
        try {
          callback(this.getState());
        } catch (error) {
          console.error('Error in global state listener:', error);
        }
      });
    }
  }

  // Persistence
  async persistState(): Promise<void> {
    try {
      const stateToSave = {
        ...this.state,
        lastSync: new Date().toISOString(),
        // Convert Maps to objects for JSON serialization
        tools: {
          tools: Object.fromEntries(this.state.tools.tools),
          activeTools: Object.fromEntries(this.state.tools.activeTools),
          healthStatus: Object.fromEntries(this.state.tools.healthStatus),
          usageStats: Object.fromEntries(this.state.tools.usageStats)
        },
        cache: {
          ...this.state.cache,
          entries: Object.fromEntries(this.state.cache.entries)
        }
      };
      
      localStorage.setItem(this.persistenceKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error persisting state:', error);
      this.addError({
        code: 'STATE_PERSISTENCE_ERROR',
        message: 'Failed to save application state',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date(),
        recoverable: true
      });
    }
  }

  async restoreState(): Promise<void> {
    try {
      const savedState = localStorage.getItem(this.persistenceKey);
      if (!savedState) return;
      
      const parsed = JSON.parse(savedState);
      
      // Restore basic state
      this.state = {
        ...this.getInitialState(),
        ...parsed,
        lastSync: new Date(parsed.lastSync),
        // Convert objects back to Maps
        tools: {
          tools: new Map(Object.entries(parsed.tools?.tools || {})),
          activeTools: new Map(Object.entries(parsed.tools?.activeTools || {})),
          healthStatus: new Map(Object.entries(parsed.tools?.healthStatus || {})),
          usageStats: new Map(Object.entries(parsed.tools?.usageStats || {}))
        },
        cache: {
          ...parsed.cache,
          entries: new Map(Object.entries(parsed.cache?.entries || {}))
        }
      };
      
      // Clean up expired cache entries
      this.cleanupCache();
      
      this.notifyListeners('*');
    } catch (error) {
      console.error('Error restoring state:', error);
      this.addError({
        code: 'STATE_RESTORATION_ERROR',
        message: 'Failed to restore application state',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date(),
        recoverable: true
      });
    }
  }

  // Auto-save functionality
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.persistState();
    }, this.autoSaveInterval);
  }

  private scheduleAutoSave(): void {
    // Debounced auto-save - reset timer on each change
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setTimeout(() => {
      this.persistState();
    }, 5000); // Save 5 seconds after last change
  }

  private setupStorageListener(): void {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === this.persistenceKey && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          // Only update if the new state is newer
          if (new Date(newState.lastSync) > this.state.lastSync) {
            this.restoreState();
          }
        } catch (error) {
          console.error('Error handling storage change:', error);
        }
      }
    });
    
    // Listen for network status changes
    window.addEventListener('online', () => {
      this.updateNetworkStatus({ online: true });
    });
    
    window.addEventListener('offline', () => {
      this.updateNetworkStatus({ online: false });
    });
  }

  // Cleanup
  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.listeners.clear();
    StateManager.instance = undefined as any;
  }

  // Utility methods
  async loadWorkspaces(): Promise<void> {
    try {
      const workspaces = await Workspace.findAll();
      this.state.workspaces = workspaces.map(w => w.id);
      this.notifyListeners('workspaces');
    } catch (error) {
      console.error('Error loading workspaces:', error);
      this.addError({
        code: 'WORKSPACE_LOAD_ERROR',
        message: 'Failed to load workspaces',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date(),
        recoverable: true
      });
    }
  }

  async loadTools(): Promise<void> {
    try {
      const tools = await ToolIntegration.findAll();
      tools.forEach((tool: ToolIntegration) => {
        this.state.tools.tools.set(tool.id, tool);
      });
      this.notifyListeners('tools');
    } catch (error) {
      console.error('Error loading tools:', error);
      this.addError({
        code: 'TOOLS_LOAD_ERROR',
        message: 'Failed to load tools',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date(),
        recoverable: true
      });
    }
  }

  // Statistics
  getStatistics() {
    return {
      workspaceCount: this.state.workspaces.length,
      toolCount: this.state.tools.tools.size,
      activeToolCount: this.state.tools.activeTools.size,
      cacheSize: this.state.cache.currentSize,
      cacheEntries: this.state.cache.entries.size,
      errorCount: this.state.errors.length,
      lastSync: this.state.lastSync
    };
  }
}

// Export singleton instance
export const stateManager = StateManager.getInstance();