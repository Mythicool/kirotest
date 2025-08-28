export interface FeatureSupport {
  feature: string;
  supported: boolean;
  fallback?: string;
  enhancement?: string;
}

export interface BrowserCapabilities {
  webWorkers: boolean;
  serviceWorkers: boolean;
  indexedDB: boolean;
  webAssembly: boolean;
  webGL: boolean;
  fileAPI: boolean;
  dragAndDrop: boolean;
  clipboard: boolean;
  notifications: boolean;
  geolocation: boolean;
  camera: boolean;
  microphone: boolean;
}

export interface EnhancementLayer {
  name: string;
  required: string[];
  optional: string[];
  fallback: () => void;
  enhance: () => void;
}

export class ProgressiveEnhancement {
  private capabilities: BrowserCapabilities;
  private enhancementLayers: Map<string, EnhancementLayer>;
  private activeFeatures: Set<string>;

  constructor() {
    this.capabilities = this.detectCapabilities();
    this.enhancementLayers = new Map();
    this.activeFeatures = new Set();
    this.initializeEnhancementLayers();
  }

  detectCapabilities(): BrowserCapabilities {
    return {
      webWorkers: typeof Worker !== 'undefined',
      serviceWorkers: 'serviceWorker' in navigator,
      indexedDB: 'indexedDB' in window,
      webAssembly: typeof WebAssembly !== 'undefined',
      webGL: this.detectWebGL(),
      fileAPI: 'File' in window && 'FileReader' in window,
      dragAndDrop: 'draggable' in document.createElement('div'),
      clipboard: 'clipboard' in navigator,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      camera: this.detectMediaDevices('videoinput'),
      microphone: this.detectMediaDevices('audioinput')
    };
  }

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  private detectMediaDevices(kind: string): boolean {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  }

  applyProgressiveEnhancement(feature: string): void {
    const layer = this.enhancementLayers.get(feature);
    if (!layer) {
      console.warn(`Enhancement layer '${feature}' not found`);
      return;
    }

    // Check if all required capabilities are supported
    const requiredSupported = layer.required.every(cap => this.isCapabilitySupported(cap));
    
    if (requiredSupported) {
      // Check optional capabilities for enhanced experience
      const optionalSupported = layer.optional.filter(cap => this.isCapabilitySupported(cap));
      
      if (optionalSupported.length > 0) {
        // Apply enhancements
        layer.enhance();
        this.activeFeatures.add(feature);
        console.log(`Enhanced feature '${feature}' with capabilities:`, optionalSupported);
      } else {
        // Basic functionality only
        this.activeFeatures.add(feature);
        console.log(`Basic feature '${feature}' activated`);
      }
    } else {
      // Use fallback
      layer.fallback();
      console.log(`Fallback activated for feature '${feature}'`);
    }
  }

  private isCapabilitySupported(capability: string): boolean {
    return (this.capabilities as any)[capability] === true;
  }

  gracefulDegradation(feature: string, error: Error): void {
    console.warn(`Feature '${feature}' failed, applying graceful degradation:`, error);
    
    const layer = this.enhancementLayers.get(feature);
    if (layer) {
      // Remove from active features
      this.activeFeatures.delete(feature);
      
      // Apply fallback
      layer.fallback();
      
      // Notify user if necessary
      this.notifyFeatureDegradation(feature);
    }
  }

  private notifyFeatureDegradation(feature: string): void {
    const userFriendlyNames: Record<string, string> = {
      'file-processing': 'File Processing',
      'real-time-collaboration': 'Real-time Collaboration',
      'offline-sync': 'Offline Synchronization',
      'advanced-editing': 'Advanced Editing Tools',
      'media-processing': 'Media Processing',
      'background-tasks': 'Background Processing'
    };

    const friendlyName = userFriendlyNames[feature] || feature;
    
    // Show non-intrusive notification
    this.showNotification(
      `${friendlyName} is running in compatibility mode`,
      'Some advanced features may be limited',
      'info'
    );
  }

  private showNotification(title: string, message: string, type: 'info' | 'warning' | 'error'): void {
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#fee' : type === 'warning' ? '#fef5e7' : '#e7f3ff'};
      border: 1px solid ${type === 'error' ? '#fcc' : type === 'warning' ? '#fed7aa' : '#bde0ff'};
      border-radius: 8px;
      padding: 16px;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  private initializeEnhancementLayers(): void {
    // File Processing Enhancement
    this.enhancementLayers.set('file-processing', {
      name: 'File Processing',
      required: ['fileAPI'],
      optional: ['webWorkers', 'webAssembly'],
      fallback: () => {
        // Basic file handling without workers
        console.log('Using basic file processing');
      },
      enhance: () => {
        // Enable worker-based processing and WASM optimizations
        console.log('Enhanced file processing with workers and WASM');
      }
    });

    // Real-time Collaboration Enhancement
    this.enhancementLayers.set('real-time-collaboration', {
      name: 'Real-time Collaboration',
      required: [],
      optional: ['webWorkers', 'serviceWorkers'],
      fallback: () => {
        // Manual refresh-based collaboration
        console.log('Manual collaboration mode');
      },
      enhance: () => {
        // WebSocket-based real-time updates
        console.log('Real-time collaboration enabled');
      }
    });

    // Offline Sync Enhancement
    this.enhancementLayers.set('offline-sync', {
      name: 'Offline Synchronization',
      required: ['indexedDB'],
      optional: ['serviceWorkers'],
      fallback: () => {
        // Session-only storage
        console.log('Session-only storage mode');
      },
      enhance: () => {
        // Full offline capabilities with background sync
        console.log('Full offline sync enabled');
      }
    });

    // Advanced Editing Enhancement
    this.enhancementLayers.set('advanced-editing', {
      name: 'Advanced Editing Tools',
      required: [],
      optional: ['webGL', 'webAssembly'],
      fallback: () => {
        // Basic editing tools
        console.log('Basic editing tools');
      },
      enhance: () => {
        // GPU-accelerated editing with advanced filters
        console.log('Advanced editing with GPU acceleration');
      }
    });

    // Media Processing Enhancement
    this.enhancementLayers.set('media-processing', {
      name: 'Media Processing',
      required: ['fileAPI'],
      optional: ['webWorkers', 'webAssembly', 'camera', 'microphone'],
      fallback: () => {
        // Basic media handling
        console.log('Basic media processing');
      },
      enhance: () => {
        // Advanced media processing with device access
        console.log('Advanced media processing with device access');
      }
    });

    // Background Tasks Enhancement
    this.enhancementLayers.set('background-tasks', {
      name: 'Background Processing',
      required: [],
      optional: ['webWorkers', 'serviceWorkers'],
      fallback: () => {
        // Synchronous processing
        console.log('Synchronous task processing');
      },
      enhance: () => {
        // Background processing with progress updates
        console.log('Background task processing enabled');
      }
    });

    // Drag and Drop Enhancement
    this.enhancementLayers.set('drag-drop', {
      name: 'Drag and Drop',
      required: [],
      optional: ['dragAndDrop', 'fileAPI'],
      fallback: () => {
        // File input button only
        console.log('File input button mode');
      },
      enhance: () => {
        // Full drag and drop with preview
        console.log('Enhanced drag and drop enabled');
      }
    });

    // Clipboard Enhancement
    this.enhancementLayers.set('clipboard', {
      name: 'Clipboard Integration',
      required: [],
      optional: ['clipboard'],
      fallback: () => {
        // Manual copy/paste instructions
        console.log('Manual clipboard operations');
      },
      enhance: () => {
        // Automatic clipboard integration
        console.log('Automatic clipboard integration enabled');
      }
    });

    // Notifications Enhancement
    this.enhancementLayers.set('notifications', {
      name: 'System Notifications',
      required: [],
      optional: ['notifications', 'serviceWorkers'],
      fallback: () => {
        // In-app notifications only
        console.log('In-app notifications only');
      },
      enhance: () => {
        // System notifications with background updates
        console.log('System notifications enabled');
      }
    });
  }

  getCapabilities(): BrowserCapabilities {
    return { ...this.capabilities };
  }

  getActiveFeatures(): string[] {
    return Array.from(this.activeFeatures);
  }

  isFeatureActive(feature: string): boolean {
    return this.activeFeatures.has(feature);
  }

  getFeatureSupport(feature: string): FeatureSupport {
    const layer = this.enhancementLayers.get(feature);
    if (!layer) {
      return {
        feature,
        supported: false
      };
    }

    const requiredSupported = layer.required.every(cap => this.isCapabilitySupported(cap));
    const optionalSupported = layer.optional.filter(cap => this.isCapabilitySupported(cap));

    return {
      feature,
      supported: requiredSupported,
      fallback: requiredSupported ? undefined : 'Basic functionality available',
      enhancement: optionalSupported.length > 0 ? `Enhanced with: ${optionalSupported.join(', ')}` : undefined
    };
  }

  initializeAllFeatures(): void {
    for (const feature of this.enhancementLayers.keys()) {
      this.applyProgressiveEnhancement(feature);
    }
  }

  // Utility method to check if a modern feature should be used
  shouldUseModernFeature(feature: string): boolean {
    const support = this.getFeatureSupport(feature);
    return support.supported && this.isFeatureActive(feature);
  }

  // Method to get fallback implementation
  getFallbackImplementation(feature: string): (() => void) | null {
    const layer = this.enhancementLayers.get(feature);
    return layer ? layer.fallback : null;
  }

  // Method to get enhanced implementation
  getEnhancedImplementation(feature: string): (() => void) | null {
    const layer = this.enhancementLayers.get(feature);
    return layer ? layer.enhance : null;
  }
}