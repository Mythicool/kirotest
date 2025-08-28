import { OfflineCapabilities } from '@/services/OfflineCapabilities';
import { Workspace } from '@/types/workspace';

// Mock IndexedDB
const mockIDBRequest = {
  onsuccess: null as any,
  onerror: null as any,
  onupgradeneeded: null as any,
  result: null as any,
  error: null as any
};

const mockIDBTransaction = {
  objectStore: jest.fn(),
  oncomplete: null as any,
  onerror: null as any
};

const mockIDBObjectStore = {
  put: jest.fn().mockReturnValue(mockIDBRequest),
  get: jest.fn().mockReturnValue(mockIDBRequest),
  getAll: jest.fn().mockReturnValue(mockIDBRequest),
  delete: jest.fn().mockReturnValue(mockIDBRequest),
  clear: jest.fn().mockReturnValue(mockIDBRequest),
  createIndex: jest.fn()
};

const mockIDBDatabase = {
  transaction: jest.fn().mockReturnValue(mockIDBTransaction),
  createObjectStore: jest.fn().mockReturnValue(mockIDBObjectStore),
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(false)
  },
  close: jest.fn()
};

Object.defineProperty(window, 'indexedDB', {
  value: {
    open: jest.fn().mockReturnValue(mockIDBRequest)
  }
});

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue({})
  }
});

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

// Mock canvas for image processing
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn().mockReturnValue({
    drawImage: jest.fn()
  }),
  toBlob: jest.fn()
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  })
});

// Mock Image
const mockImage = {
  onload: null as any,
  onerror: null as any,
  src: '',
  width: 100,
  height: 100
};

Object.defineProperty(window, 'Image', {
  value: jest.fn().mockImplementation(() => mockImage)
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn().mockReturnValue('blob:mock-url')
});

describe('OfflineCapabilities', () => {
  let offlineCapabilities: OfflineCapabilities;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup IndexedDB mocks
    mockIDBRequest.result = mockIDBDatabase;
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
    
    // Mock successful IndexedDB operations
    mockIDBObjectStore.put.mockReturnValue({
      ...mockIDBRequest,
      onsuccess: null,
      onerror: null
    });

    mockIDBObjectStore.getAll.mockReturnValue({
      ...mockIDBRequest,
      result: []
    });

    offlineCapabilities = new OfflineCapabilities();

    // Trigger IndexedDB initialization
    if (mockIDBRequest.onsuccess) {
      mockIDBRequest.onsuccess();
    }
  });

  afterEach(() => {
    offlineCapabilities.destroy();
  });

  describe('initialization', () => {
    it('should initialize IndexedDB', () => {
      expect(window.indexedDB.open).toHaveBeenCalledWith('NoLoginAppCombinations', 1);
    });

    it('should register service worker', () => {
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('should set up network event listeners', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      new OfflineCapabilities();

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should create object stores on database upgrade', () => {
      const upgradeEvent = {
        target: { result: mockIDBDatabase }
      };

      if (mockIDBRequest.onupgradeneeded) {
        mockIDBRequest.onupgradeneeded(upgradeEvent);
      }

      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('workspaces', { keyPath: 'id' });
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('files', { keyPath: 'id' });
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('operations', { keyPath: 'id' });
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('metadata', { keyPath: 'key' });
    });
  });

  describe('workspace operations', () => {
    it('should save workspace offline', async () => {
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

      await offlineCapabilities.saveWorkspaceOffline(workspace);

      // Should store in IndexedDB
      expect(mockIDBObjectStore.put).toHaveBeenCalledWith(workspace);
    });

    it('should get workspace offline', async () => {
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

      await offlineCapabilities.saveWorkspaceOffline(workspace);
      const retrieved = await offlineCapabilities.getWorkspaceOffline('test-workspace');

      expect(retrieved).toEqual(workspace);
    });

    it('should return null for non-existent workspace', async () => {
      const retrieved = await offlineCapabilities.getWorkspaceOffline('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should get all workspaces offline', async () => {
      const workspace1: Workspace = {
        id: 'workspace-1',
        name: 'Workspace 1',
        type: 'creative-studio',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      const workspace2: Workspace = {
        id: 'workspace-2',
        name: 'Workspace 2',
        type: 'developer-hub',
        created: new Date(),
        lastModified: new Date(),
        files: [],
        tools: [],
        settings: {}
      };

      await offlineCapabilities.saveWorkspaceOffline(workspace1);
      await offlineCapabilities.saveWorkspaceOffline(workspace2);

      const allWorkspaces = await offlineCapabilities.getAllWorkspacesOffline();
      expect(allWorkspaces).toHaveLength(2);
      expect(allWorkspaces).toContainEqual(workspace1);
      expect(allWorkspaces).toContainEqual(workspace2);
    });
  });

  describe('file operations', () => {
    it('should save file offline', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const metadata = { description: 'Test file' };

      await offlineCapabilities.saveFileOffline('test-file', blob, metadata);

      expect(mockIDBObjectStore.put).toHaveBeenCalledWith({
        id: 'test-file',
        blob,
        metadata
      });
    });

    it('should get file offline', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });

      await offlineCapabilities.saveFileOffline('test-file', blob);
      const retrieved = await offlineCapabilities.getFileOffline('test-file');

      expect(retrieved).toBe(blob);
    });

    it('should return null for non-existent file', async () => {
      const retrieved = await offlineCapabilities.getFileOffline('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('offline file processing', () => {
    it('should resize image offline', async () => {
      const blob = new Blob(['image data'], { type: 'image/png' });
      await offlineCapabilities.saveFileOffline('test-image', blob);

      // Mock successful image processing
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(new Blob(['resized image'], { type: 'image/png' }));
      });

      const result = await offlineCapabilities.processFileOffline('test-image', 'resize-image', {
        width: 200,
        height: 200
      });

      expect(result).toBeInstanceOf(Blob);
      expect(mockImage.onload).toBeDefined();
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
    });

    it('should convert image format offline', async () => {
      const blob = new Blob(['image data'], { type: 'image/png' });
      await offlineCapabilities.saveFileOffline('test-image', blob);

      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(new Blob(['converted image'], { type: 'image/jpeg' }));
      });

      const result = await offlineCapabilities.processFileOffline('test-image', 'convert-format', {
        targetFormat: 'jpeg'
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should compress image offline', async () => {
      const blob = new Blob(['image data'], { type: 'image/png' });
      await offlineCapabilities.saveFileOffline('test-image', blob);

      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(new Blob(['compressed image'], { type: 'image/png' }));
      });

      const result = await offlineCapabilities.processFileOffline('test-image', 'compress', {
        quality: 0.8
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should throw error for unsupported operation', async () => {
      const blob = new Blob(['test data'], { type: 'text/plain' });
      await offlineCapabilities.saveFileOffline('test-file', blob);

      await expect(
        offlineCapabilities.processFileOffline('test-file', 'unsupported-operation', {})
      ).rejects.toThrow('Offline processing not supported for operation: unsupported-operation');
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        offlineCapabilities.processFileOffline('non-existent', 'resize-image', {})
      ).rejects.toThrow('File non-existent not found in offline storage');
    });

    it('should return original file for unsupported compression format', async () => {
      const blob = new Blob(['test data'], { type: 'text/plain' });
      await offlineCapabilities.saveFileOffline('test-file', blob);

      const result = await offlineCapabilities.processFileOffline('test-file', 'compress', {
        quality: 0.8
      });

      expect(result).toBe(blob);
    });
  });

  describe('operation queue management', () => {
    it('should queue operations when online', async () => {
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

      await offlineCapabilities.saveWorkspaceOffline(workspace);

      const pendingOperations = offlineCapabilities.getPendingOperations();
      expect(pendingOperations.length).toBeGreaterThan(0);
      expect(pendingOperations[0].type).toBe('workspace-save');
    });

    it('should not queue operations when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      const oc = new OfflineCapabilities();
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

      await oc.saveWorkspaceOffline(workspace);

      const pendingOperations = oc.getPendingOperations();
      expect(pendingOperations).toHaveLength(0);

      oc.destroy();
    });

    it('should retry failed operations', async () => {
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

      await offlineCapabilities.saveWorkspaceOffline(workspace);

      // Simulate failed operation
      const operations = offlineCapabilities.getPendingOperations();
      if (operations.length > 0) {
        operations[0].status = 'failed';
      }

      const failedOperations = offlineCapabilities.getFailedOperations();
      expect(failedOperations).toHaveLength(1);

      await offlineCapabilities.retryFailedOperations();

      const pendingAfterRetry = offlineCapabilities.getPendingOperations();
      expect(pendingAfterRetry.length).toBeGreaterThan(0);
    });

    it('should clear completed operations', async () => {
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

      await offlineCapabilities.saveWorkspaceOffline(workspace);

      // Simulate completed operation
      const operations = offlineCapabilities.getPendingOperations();
      if (operations.length > 0) {
        operations[0].status = 'completed';
      }

      await offlineCapabilities.clearCompletedOperations();

      // Should remove completed operations from storage
      expect(mockIDBObjectStore.delete).toHaveBeenCalled();
    });
  });

  describe('sync status', () => {
    it('should report correct sync status', () => {
      const status = offlineCapabilities.getSyncStatus();

      expect(status.isOnline).toBe(true);
      expect(status.syncInProgress).toBe(false);
      expect(typeof status.lastSync).toBe('number');
      expect(typeof status.pendingOperations).toBe('number');
    });

    it('should update sync status when going offline', () => {
      const mockEventListener = jest.fn();
      offlineCapabilities.on('network-status-changed', mockEventListener);

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      // Trigger offline event
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      expect(mockEventListener).toHaveBeenCalledWith({ isOnline: false });
    });

    it('should update sync status when going online', () => {
      const mockEventListener = jest.fn();
      offlineCapabilities.on('network-status-changed', mockEventListener);

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });

      // Trigger online event
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      expect(mockEventListener).toHaveBeenCalledWith({ isOnline: true });
    });
  });

  describe('storage management', () => {
    it('should report storage usage', () => {
      const usage = offlineCapabilities.getStorageUsage();

      expect(usage).toHaveProperty('workspaces');
      expect(usage).toHaveProperty('files');
      expect(usage).toHaveProperty('operations');
      expect(typeof usage.workspaces).toBe('number');
      expect(typeof usage.files).toBe('number');
      expect(typeof usage.operations).toBe('number');
    });

    it('should clear offline storage', async () => {
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

      await offlineCapabilities.saveWorkspaceOffline(workspace);

      const usageBeforeClear = offlineCapabilities.getStorageUsage();
      expect(usageBeforeClear.workspaces).toBeGreaterThan(0);

      await offlineCapabilities.clearOfflineStorage();

      const usageAfterClear = offlineCapabilities.getStorageUsage();
      expect(usageAfterClear.workspaces).toBe(0);
      expect(usageAfterClear.files).toBe(0);
      expect(usageAfterClear.operations).toBe(0);
    });
  });

  describe('event system', () => {
    it('should emit events for workspace operations', async () => {
      const mockListener = jest.fn();
      offlineCapabilities.on('workspace-saved-offline', mockListener);

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

      await offlineCapabilities.saveWorkspaceOffline(workspace);

      expect(mockListener).toHaveBeenCalledWith({ workspace });
    });

    it('should emit events for file operations', async () => {
      const mockListener = jest.fn();
      offlineCapabilities.on('file-saved-offline', mockListener);

      const blob = new Blob(['test content'], { type: 'text/plain' });
      await offlineCapabilities.saveFileOffline('test-file', blob);

      expect(mockListener).toHaveBeenCalledWith({
        fileId: 'test-file',
        size: blob.size
      });
    });

    it('should remove event listeners', () => {
      const mockListener = jest.fn();
      offlineCapabilities.on('test-event', mockListener);
      offlineCapabilities.off('test-event', mockListener);

      // Emit event - listener should not be called
      (offlineCapabilities as any).emit('test-event', {});
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      offlineCapabilities.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(mockIDBDatabase.close).toHaveBeenCalled();
    });
  });
});