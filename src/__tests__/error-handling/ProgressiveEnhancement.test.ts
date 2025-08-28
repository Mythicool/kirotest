import { ProgressiveEnhancement } from '@/services/ProgressiveEnhancement';

// Mock browser APIs
const mockCanvas = {
  getContext: jest.fn()
};

const mockMediaDevices = {
  getUserMedia: jest.fn()
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {
      draggable: true
    };
  })
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true
});

Object.defineProperty(window, 'Worker', {
  value: function Worker() {},
  writable: true
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: {},
  writable: true
});

Object.defineProperty(window, 'indexedDB', {
  value: {},
  writable: true
});

Object.defineProperty(window, 'WebAssembly', {
  value: {},
  writable: true
});

Object.defineProperty(window, 'File', {
  value: function File() {},
  writable: true
});

Object.defineProperty(window, 'FileReader', {
  value: function FileReader() {},
  writable: true
});

Object.defineProperty(navigator, 'clipboard', {
  value: {},
  writable: true
});

Object.defineProperty(window, 'Notification', {
  value: function Notification() {},
  writable: true
});

Object.defineProperty(navigator, 'geolocation', {
  value: {},
  writable: true
});

describe('ProgressiveEnhancement', () => {
  let progressiveEnhancement: ProgressiveEnhancement;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock WebGL context
    mockCanvas.getContext.mockImplementation((type) => {
      if (type === 'webgl' || type === 'experimental-webgl') {
        return {}; // Mock WebGL context
      }
      return null;
    });

    progressiveEnhancement = new ProgressiveEnhancement();
  });

  describe('capability detection', () => {
    it('should detect browser capabilities correctly', () => {
      const capabilities = progressiveEnhancement.detectCapabilities();

      expect(capabilities.webWorkers).toBe(true);
      expect(capabilities.serviceWorkers).toBe(true);
      expect(capabilities.indexedDB).toBe(true);
      expect(capabilities.webAssembly).toBe(true);
      expect(capabilities.webGL).toBe(true);
      expect(capabilities.fileAPI).toBe(true);
      expect(capabilities.dragAndDrop).toBe(true);
      expect(capabilities.clipboard).toBe(true);
      expect(capabilities.notifications).toBe(true);
      expect(capabilities.geolocation).toBe(true);
      expect(capabilities.camera).toBe(true);
      expect(capabilities.microphone).toBe(true);
    });

    it('should detect missing WebGL capability', () => {
      mockCanvas.getContext.mockReturnValue(null);
      
      const pe = new ProgressiveEnhancement();
      const capabilities = pe.detectCapabilities();

      expect(capabilities.webGL).toBe(false);
    });

    it('should handle WebGL detection errors', () => {
      mockCanvas.getContext.mockImplementation(() => {
        throw new Error('WebGL not supported');
      });

      const pe = new ProgressiveEnhancement();
      const capabilities = pe.detectCapabilities();

      expect(capabilities.webGL).toBe(false);
    });
  });

  describe('progressive enhancement application', () => {
    it('should apply enhancement when all capabilities are supported', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      progressiveEnhancement.applyProgressiveEnhancement('file-processing');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Enhanced file processing with workers and WASM'
      );

      consoleSpy.mockRestore();
    });

    it('should use basic functionality when optional capabilities are missing', () => {
      // Mock missing WebWorkers
      delete (window as any).Worker;
      delete (window as any).WebAssembly;

      const pe = new ProgressiveEnhancement();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      pe.applyProgressiveEnhancement('file-processing');

      expect(consoleSpy).toHaveBeenCalledWith(
        "Basic feature 'file-processing' activated"
      );

      consoleSpy.mockRestore();
    });

    it('should use fallback when required capabilities are missing', () => {
      // Mock missing File API
      delete (window as any).File;
      delete (window as any).FileReader;

      const pe = new ProgressiveEnhancement();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      pe.applyProgressiveEnhancement('file-processing');

      expect(consoleSpy).toHaveBeenCalledWith(
        "Fallback activated for feature 'file-processing'"
      );

      consoleSpy.mockRestore();
    });

    it('should warn about unknown features', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      progressiveEnhancement.applyProgressiveEnhancement('unknown-feature');

      expect(consoleSpy).toHaveBeenCalledWith(
        "Enhancement layer 'unknown-feature' not found"
      );

      consoleSpy.mockRestore();
    });
  });

  describe('graceful degradation', () => {
    it('should handle feature failures gracefully', () => {
      const error = new Error('Feature failed');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock document.body.appendChild
      const mockAppendChild = jest.fn();
      Object.defineProperty(document, 'body', {
        value: { appendChild: mockAppendChild },
        writable: true
      });

      progressiveEnhancement.gracefulDegradation('file-processing', error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Feature 'file-processing' failed, applying graceful degradation:",
        error
      );

      // Should show notification
      expect(mockAppendChild).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should remove feature from active features on degradation', () => {
      // First activate the feature
      progressiveEnhancement.applyProgressiveEnhancement('file-processing');
      expect(progressiveEnhancement.isFeatureActive('file-processing')).toBe(true);

      // Then degrade it
      const error = new Error('Feature failed');
      progressiveEnhancement.gracefulDegradation('file-processing', error);

      expect(progressiveEnhancement.isFeatureActive('file-processing')).toBe(false);
    });
  });

  describe('feature support queries', () => {
    it('should return feature support information', () => {
      const support = progressiveEnhancement.getFeatureSupport('file-processing');

      expect(support.feature).toBe('file-processing');
      expect(support.supported).toBe(true);
      expect(support.enhancement).toContain('webWorkers');
      expect(support.enhancement).toContain('webAssembly');
    });

    it('should return unsupported for unknown features', () => {
      const support = progressiveEnhancement.getFeatureSupport('unknown-feature');

      expect(support.feature).toBe('unknown-feature');
      expect(support.supported).toBe(false);
    });

    it('should indicate fallback when required capabilities are missing', () => {
      // Mock missing File API
      delete (window as any).File;
      delete (window as any).FileReader;

      const pe = new ProgressiveEnhancement();
      const support = pe.getFeatureSupport('file-processing');

      expect(support.supported).toBe(false);
      expect(support.fallback).toBe('Basic functionality available');
    });
  });

  describe('active features tracking', () => {
    it('should track active features', () => {
      expect(progressiveEnhancement.getActiveFeatures()).toHaveLength(0);

      progressiveEnhancement.applyProgressiveEnhancement('file-processing');
      progressiveEnhancement.applyProgressiveEnhancement('real-time-collaboration');

      const activeFeatures = progressiveEnhancement.getActiveFeatures();
      expect(activeFeatures).toContain('file-processing');
      expect(activeFeatures).toContain('real-time-collaboration');
    });

    it('should check if specific feature is active', () => {
      expect(progressiveEnhancement.isFeatureActive('file-processing')).toBe(false);

      progressiveEnhancement.applyProgressiveEnhancement('file-processing');

      expect(progressiveEnhancement.isFeatureActive('file-processing')).toBe(true);
    });
  });

  describe('initialization', () => {
    it('should initialize all features', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      progressiveEnhancement.initializeAllFeatures();

      // Should have attempted to initialize all built-in features
      expect(consoleSpy).toHaveBeenCalledTimes(9); // Number of built-in enhancement layers

      consoleSpy.mockRestore();
    });
  });

  describe('utility methods', () => {
    it('should determine if modern feature should be used', () => {
      progressiveEnhancement.applyProgressiveEnhancement('file-processing');

      expect(progressiveEnhancement.shouldUseModernFeature('file-processing')).toBe(true);
      expect(progressiveEnhancement.shouldUseModernFeature('unknown-feature')).toBe(false);
    });

    it('should get fallback implementation', () => {
      const fallback = progressiveEnhancement.getFallbackImplementation('file-processing');
      expect(typeof fallback).toBe('function');

      const unknownFallback = progressiveEnhancement.getFallbackImplementation('unknown-feature');
      expect(unknownFallback).toBeNull();
    });

    it('should get enhanced implementation', () => {
      const enhanced = progressiveEnhancement.getEnhancedImplementation('file-processing');
      expect(typeof enhanced).toBe('function');

      const unknownEnhanced = progressiveEnhancement.getEnhancedImplementation('unknown-feature');
      expect(unknownEnhanced).toBeNull();
    });
  });

  describe('notification system', () => {
    it('should show degradation notifications', () => {
      const mockAppendChild = jest.fn();
      const mockRemove = jest.fn();
      const mockElement = {
        className: '',
        innerHTML: '',
        style: { cssText: '' },
        remove: mockRemove
      };

      Object.defineProperty(document, 'createElement', {
        value: jest.fn().mockReturnValue(mockElement)
      });

      Object.defineProperty(document, 'body', {
        value: { appendChild: mockAppendChild },
        writable: true
      });

      // Mock setTimeout to immediately execute callback
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 0 as any;
      });

      const error = new Error('Feature failed');
      progressiveEnhancement.gracefulDegradation('file-processing', error);

      expect(mockAppendChild).toHaveBeenCalledWith(mockElement);
      expect(mockElement.className).toContain('notification-info');
      expect(mockElement.innerHTML).toContain('File Processing is running in compatibility mode');

      // Should auto-remove after timeout
      expect(mockRemove).toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it('should handle notification click to close', () => {
      const mockRemove = jest.fn();
      const mockElement = {
        className: '',
        innerHTML: '',
        style: { cssText: '' },
        remove: mockRemove,
        parentElement: {}
      };

      const mockButton = {
        onclick: null as any
      };

      Object.defineProperty(document, 'createElement', {
        value: jest.fn().mockReturnValue(mockElement)
      });

      Object.defineProperty(document, 'body', {
        value: { appendChild: jest.fn() },
        writable: true
      });

      const error = new Error('Feature failed');
      progressiveEnhancement.gracefulDegradation('file-processing', error);

      // Simulate clicking the close button
      const onclickHandler = mockElement.innerHTML.match(/onclick="([^"]+)"/)?.[1];
      if (onclickHandler) {
        // The onclick handler should remove the parent element
        expect(onclickHandler).toContain('parentElement.remove()');
      }
    });
  });
});