import { FileReference } from '@/types/file';
import { Workspace } from '@/types/workspace';

export interface OfflineOperation {
  id: string;
  type: 'file-upload' | 'file-process' | 'workspace-save' | 'tool-operation';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface OfflineStorage {
  workspaces: Map<string, Workspace>;
  files: Map<string, Blob>;
  operations: Map<string, OfflineOperation>;
  metadata: Map<string, any>;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingOperations: number;
  syncInProgress: boolean;
}

export class OfflineCapabilities {
  private storage: OfflineStorage;
  private db: IDBDatabase | null = null;
  private syncStatus: SyncStatus;
  private syncInterval: number | null = null;
  private eventListeners: Map<string, Function[]>;

  constructor() {
    this.storage = {
      workspaces: new Map(),
      files: new Map(),
      operations: new Map(),
      metadata: new Map()
    };

    this.syncStatus = {
      isOnline: navigator.onLine,
      lastSync: 0,
      pendingOperations: 0,
      syncInProgress: false
    };

    this.eventListeners = new Map();
    this.initializeOfflineCapabilities();
  }

  private async initializeOfflineCapabilities(): Promise<void> {
    // Initialize IndexedDB
    await this.initializeDatabase();

    // Load existing data from storage
    await this.loadFromStorage();

    // Set up network event listeners
    this.setupNetworkListeners();

    // Start sync interval
    this.startSyncInterval();

    // Register service worker for background sync
    await this.registerServiceWorker();
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NoLoginAppCombinations', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('workspaces')) {
          db.createObjectStore('workspaces', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('operations')) {
          const operationsStore = db.createObjectStore('operations', { keyPath: 'id' });
          operationsStore.createIndex('status', 'status', { unique: false });
          operationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  private async loadFromStorage(): Promise<void> {
    if (!this.db) return;

    try {
      // Load workspaces
      const workspaces = await this.getAllFromStore('workspaces');
      for (const workspace of workspaces) {
        this.storage.workspaces.set(workspace.id, workspace);
      }

      // Load files
      const files = await this.getAllFromStore('files');
      for (const file of files) {
        this.storage.files.set(file.id, file.blob);
      }

      // Load pending operations
      const operations = await this.getAllFromStore('operations');
      for (const operation of operations) {
        this.storage.operations.set(operation.id, operation);
      }

      // Update sync status
      this.syncStatus.pendingOperations = Array.from(this.storage.operations.values())
        .filter(op => op.status === 'pending').length;

    } catch (error) {
      console.error('Failed to load from offline storage:', error);
    }
  }

  private async getAllFromStore(storeName: string): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.emit('network-status-changed', { isOnline: true });
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      this.emit('network-status-changed', { isOnline: false });
    });
  }

  private startSyncInterval(): void {
    // Sync every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
        this.syncPendingOperations();
      }
    }, 30000);
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Listen for background sync events
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          // Background sync is supported
          console.log('Background sync is supported');
        }
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  // Workspace operations
  async saveWorkspaceOffline(workspace: Workspace): Promise<void> {
    // Store in memory
    this.storage.workspaces.set(workspace.id, workspace);

    // Store in IndexedDB
    if (this.db) {
      await this.saveToStore('workspaces', workspace);
    }

    // Queue sync operation if online
    if (this.syncStatus.isOnline) {
      await this.queueOperation({
        type: 'workspace-save',
        data: workspace,
        maxRetries: 3
      });
    }

    this.emit('workspace-saved-offline', { workspace });
  }

  async getWorkspaceOffline(workspaceId: string): Promise<Workspace | null> {
    return this.storage.workspaces.get(workspaceId) || null;
  }

  async getAllWorkspacesOffline(): Promise<Workspace[]> {
    return Array.from(this.storage.workspaces.values());
  }

  // File operations
  async saveFileOffline(fileId: string, blob: Blob, metadata?: any): Promise<void> {
    // Store file blob
    this.storage.files.set(fileId, blob);

    // Store in IndexedDB
    if (this.db) {
      await this.saveToStore('files', { id: fileId, blob, metadata });
    }

    // Queue upload operation if online
    if (this.syncStatus.isOnline) {
      await this.queueOperation({
        type: 'file-upload',
        data: { fileId, blob, metadata },
        maxRetries: 5
      });
    }

    this.emit('file-saved-offline', { fileId, size: blob.size });
  }

  async getFileOffline(fileId: string): Promise<Blob | null> {
    return this.storage.files.get(fileId) || null;
  }

  async processFileOffline(fileId: string, operation: string, params: any): Promise<any> {
    const file = await this.getFileOffline(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found in offline storage`);
    }

    // Perform local processing based on operation type
    switch (operation) {
      case 'resize-image':
        return this.resizeImageOffline(file, params);
      case 'convert-format':
        return this.convertFormatOffline(file, params);
      case 'compress':
        return this.compressFileOffline(file, params);
      default:
        throw new Error(`Offline processing not supported for operation: ${operation}`);
    }
  }

  private async resizeImageOffline(blob: Blob, params: { width: number; height: number }): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        canvas.width = params.width;
        canvas.height = params.height;
        ctx.drawImage(img, 0, 0, params.width, params.height);
        
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, 'image/png');
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  private async convertFormatOffline(blob: Blob, params: { targetFormat: string }): Promise<Blob> {
    // Basic format conversion using canvas for images
    if (blob.type.startsWith('image/')) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const mimeType = `image/${params.targetFormat}`;
          canvas.toBlob((result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Failed to convert image format'));
            }
          }, mimeType);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(blob);
      });
    }

    throw new Error(`Format conversion not supported offline for ${blob.type}`);
  }

  private async compressFileOffline(blob: Blob, params: { quality: number }): Promise<Blob> {
    if (blob.type.startsWith('image/')) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Failed to compress image'));
            }
          }, blob.type, params.quality);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(blob);
      });
    }

    // For other file types, return original (no compression available offline)
    return blob;
  }

  // Operation queue management
  private async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    const fullOperation: OfflineOperation = {
      id: this.generateOperationId(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
      ...operation
    };

    this.storage.operations.set(fullOperation.id, fullOperation);
    
    if (this.db) {
      await this.saveToStore('operations', fullOperation);
    }

    this.syncStatus.pendingOperations++;
    this.emit('operation-queued', { operation: fullOperation });

    return fullOperation.id;
  }

  private async syncPendingOperations(): Promise<void> {
    if (this.syncStatus.syncInProgress || !this.syncStatus.isOnline) {
      return;
    }

    this.syncStatus.syncInProgress = true;
    this.emit('sync-started', {});

    const pendingOperations = Array.from(this.storage.operations.values())
      .filter(op => op.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp);

    let syncedCount = 0;
    let failedCount = 0;

    for (const operation of pendingOperations) {
      try {
        await this.executeOperation(operation);
        operation.status = 'completed';
        syncedCount++;
      } catch (error) {
        operation.retryCount++;
        if (operation.retryCount >= operation.maxRetries) {
          operation.status = 'failed';
          failedCount++;
        }
        console.error(`Operation ${operation.id} failed:`, error);
      }

      // Update operation in storage
      this.storage.operations.set(operation.id, operation);
      if (this.db) {
        await this.saveToStore('operations', operation);
      }
    }

    this.syncStatus.pendingOperations = Array.from(this.storage.operations.values())
      .filter(op => op.status === 'pending').length;
    this.syncStatus.lastSync = Date.now();
    this.syncStatus.syncInProgress = false;

    this.emit('sync-completed', { syncedCount, failedCount });
  }

  private async executeOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.type) {
      case 'workspace-save':
        // Sync workspace to server
        await this.syncWorkspaceToServer(operation.data);
        break;
      case 'file-upload':
        // Upload file to server
        await this.uploadFileToServer(operation.data);
        break;
      case 'file-process':
        // Process file on server
        await this.processFileOnServer(operation.data);
        break;
      case 'tool-operation':
        // Execute tool operation on server
        await this.executeToolOperationOnServer(operation.data);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async syncWorkspaceToServer(workspace: Workspace): Promise<void> {
    // Placeholder for server sync
    console.log('Syncing workspace to server:', workspace.id);
  }

  private async uploadFileToServer(data: { fileId: string; blob: Blob; metadata?: any }): Promise<void> {
    // Placeholder for file upload
    console.log('Uploading file to server:', data.fileId);
  }

  private async processFileOnServer(data: any): Promise<void> {
    // Placeholder for server processing
    console.log('Processing file on server:', data);
  }

  private async executeToolOperationOnServer(data: any): Promise<void> {
    // Placeholder for tool operation
    console.log('Executing tool operation on server:', data);
  }

  private async saveToStore(storeName: string, data: any): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      }
    }
  }

  // Public API
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  getPendingOperations(): OfflineOperation[] {
    return Array.from(this.storage.operations.values())
      .filter(op => op.status === 'pending');
  }

  getFailedOperations(): OfflineOperation[] {
    return Array.from(this.storage.operations.values())
      .filter(op => op.status === 'failed');
  }

  async retryFailedOperations(): Promise<void> {
    const failedOperations = this.getFailedOperations();
    for (const operation of failedOperations) {
      operation.status = 'pending';
      operation.retryCount = 0;
      this.storage.operations.set(operation.id, operation);
      
      if (this.db) {
        await this.saveToStore('operations', operation);
      }
    }

    this.syncStatus.pendingOperations += failedOperations.length;
    
    if (this.syncStatus.isOnline) {
      this.syncPendingOperations();
    }
  }

  async clearCompletedOperations(): Promise<void> {
    const completedOperations = Array.from(this.storage.operations.values())
      .filter(op => op.status === 'completed');

    for (const operation of completedOperations) {
      this.storage.operations.delete(operation.id);
      
      if (this.db) {
        const transaction = this.db.transaction(['operations'], 'readwrite');
        const store = transaction.objectStore('operations');
        store.delete(operation.id);
      }
    }
  }

  getStorageUsage(): { workspaces: number; files: number; operations: number } {
    return {
      workspaces: this.storage.workspaces.size,
      files: this.storage.files.size,
      operations: this.storage.operations.size
    };
  }

  async clearOfflineStorage(): Promise<void> {
    // Clear memory storage
    this.storage.workspaces.clear();
    this.storage.files.clear();
    this.storage.operations.clear();
    this.storage.metadata.clear();

    // Clear IndexedDB
    if (this.db) {
      const stores = ['workspaces', 'files', 'operations', 'metadata'];
      for (const storeName of stores) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.clear();
      }
    }

    this.syncStatus.pendingOperations = 0;
    this.emit('storage-cleared', {});
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (this.db) {
      this.db.close();
    }

    this.eventListeners.clear();
  }
}