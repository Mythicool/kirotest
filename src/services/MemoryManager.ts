export interface MemoryUsage {
  used: number;
  total: number;
  limit: number;
  percentage: number;
}

export interface MemoryThresholds {
  warning: number;
  critical: number;
  cleanup: number;
}

export interface ManagedResource {
  id: string;
  type: 'component' | 'cache' | 'worker' | 'blob' | 'image' | 'audio' | 'video';
  size: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cleanup: () => void;
}

export class MemoryManager {
  private resources = new Map<string, ManagedResource>();
  private thresholds: MemoryThresholds;
  private cleanupInterval: number | null = null;
  private isMonitoring = false;
  private observers: Set<(usage: MemoryUsage) => void> = new Set();

  constructor(thresholds: MemoryThresholds = {
    warning: 50, // 50MB
    critical: 100, // 100MB
    cleanup: 80 // 80MB
  }) {
    this.thresholds = thresholds;
    this.startMonitoring();
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // Check memory usage every 10 seconds
    this.cleanupInterval = window.setInterval(() => {
      this.checkMemoryUsage();
    }, 10000);

    // Listen for memory pressure events
    if ('memory' in performance) {
      this.setupMemoryPressureHandling();
    }

    console.log('Memory monitoring started');
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.log('Memory monitoring stopped');
  }

  private setupMemoryPressureHandling(): void {
    // Listen for memory pressure events (experimental)
    if ('onmemorywarning' in window) {
      window.addEventListener('memorywarning', () => {
        console.warn('Memory warning received, performing aggressive cleanup');
        this.performAggressiveCleanup();
      });
    }

    // Listen for page visibility changes to cleanup when hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performBackgroundCleanup();
      }
    });
  }

  public registerResource(resource: ManagedResource): void {
    this.resources.set(resource.id, {
      ...resource,
      lastAccessed: Date.now()
    });

    // Check if we need immediate cleanup
    const usage = this.getMemoryUsage();
    if (usage.used > this.thresholds.cleanup) {
      this.performCleanup();
    }
  }

  public unregisterResource(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      try {
        resource.cleanup();
      } catch (error) {
        console.warn(`Error cleaning up resource ${resourceId}:`, error);
      }
      this.resources.delete(resourceId);
    }
  }

  public accessResource(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      resource.lastAccessed = Date.now();
    }
  }

  private checkMemoryUsage(): void {
    const usage = this.getMemoryUsage();
    
    // Notify observers
    this.observers.forEach(observer => observer(usage));

    if (usage.used > this.thresholds.critical) {
      console.warn('Critical memory usage detected, performing emergency cleanup');
      this.performAggressiveCleanup();
    } else if (usage.used > this.thresholds.cleanup) {
      console.log('High memory usage detected, performing cleanup');
      this.performCleanup();
    } else if (usage.used > this.thresholds.warning) {
      console.log('Memory usage warning threshold reached');
    }
  }

  public getMemoryUsage(): MemoryUsage {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
        total: memory.totalJSHeapSize / 1024 / 1024,
        limit: memory.jsHeapSizeLimit / 1024 / 1024,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }

    // Fallback estimation
    const estimatedUsage = this.estimateMemoryUsage();
    return {
      used: estimatedUsage,
      total: estimatedUsage * 1.2,
      limit: 100, // Assume 100MB limit
      percentage: (estimatedUsage / 100) * 100
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on registered resources
    let totalSize = 0;
    this.resources.forEach(resource => {
      totalSize += resource.size;
    });
    return totalSize / 1024 / 1024; // Convert to MB
  }

  private performCleanup(): void {
    const now = Date.now();
    const resourcesArray = Array.from(this.resources.entries());
    
    // Sort by priority (low first) and last accessed time (oldest first)
    resourcesArray.sort(([, a], [, b]) => {
      const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return a.lastAccessed - b.lastAccessed;
    });

    // Clean up resources that haven't been accessed in the last 5 minutes
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    let cleanedCount = 0;

    for (const [id, resource] of resourcesArray) {
      if (resource.priority === 'critical') continue;
      
      if (resource.lastAccessed < fiveMinutesAgo || resource.priority === 'low') {
        this.unregisterResource(id);
        cleanedCount++;
        
        // Stop if we've cleaned enough
        if (cleanedCount >= 10) break;
      }
    }

    // Force garbage collection if available
    this.forceGarbageCollection();

    console.log(`Cleaned up ${cleanedCount} resources`);
  }

  private performAggressiveCleanup(): void {
    const resourcesArray = Array.from(this.resources.entries());
    
    // Clean up all non-critical resources
    let cleanedCount = 0;
    for (const [id, resource] of resourcesArray) {
      if (resource.priority !== 'critical') {
        this.unregisterResource(id);
        cleanedCount++;
      }
    }

    // Clear various caches
    this.clearBrowserCaches();
    
    // Force garbage collection
    this.forceGarbageCollection();

    console.log(`Aggressively cleaned up ${cleanedCount} resources`);
  }

  private performBackgroundCleanup(): void {
    // Lighter cleanup when page is in background
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    
    let cleanedCount = 0;
    this.resources.forEach((resource, id) => {
      if (resource.priority === 'low' && resource.lastAccessed < tenMinutesAgo) {
        this.unregisterResource(id);
        cleanedCount++;
      }
    });

    console.log(`Background cleanup: removed ${cleanedCount} resources`);
  }

  private clearBrowserCaches(): void {
    // Clear various browser caches
    try {
      // Clear image cache by creating new images with cache-busting
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src && !img.src.includes('data:')) {
          const url = new URL(img.src);
          url.searchParams.set('_cb', Date.now().toString());
          img.src = url.toString();
        }
      });

      // Clear any custom caches
      if ((window as any).__lazyLoaderCache) {
        (window as any).__lazyLoaderCache.clear();
      }

      // Clear URL object cache
      if ('URL' in window && 'revokeObjectURL' in URL) {
        // Note: We can't revoke all URLs as we don't track them
        // This would need to be implemented in the URL creation logic
      }
    } catch (error) {
      console.warn('Error clearing caches:', error);
    }
  }

  private forceGarbageCollection(): void {
    // Force garbage collection if available (Chrome DevTools)
    if ('gc' in window) {
      (window as any).gc();
    }

    // Alternative approach: create memory pressure
    try {
      const arrays = [];
      for (let i = 0; i < 10; i++) {
        arrays.push(new Array(1000000).fill(0));
      }
      // Let arrays go out of scope to trigger GC
    } catch (error) {
      // Ignore memory allocation errors
    }
  }

  // Resource-specific cleanup helpers
  public cleanupImages(): void {
    this.resources.forEach((resource, id) => {
      if (resource.type === 'image') {
        this.unregisterResource(id);
      }
    });
  }

  public cleanupWorkers(): void {
    this.resources.forEach((resource, id) => {
      if (resource.type === 'worker') {
        this.unregisterResource(id);
      }
    });
  }

  public cleanupBlobs(): void {
    this.resources.forEach((resource, id) => {
      if (resource.type === 'blob') {
        this.unregisterResource(id);
      }
    });
  }

  public cleanupCache(): void {
    this.resources.forEach((resource, id) => {
      if (resource.type === 'cache') {
        this.unregisterResource(id);
      }
    });
  }

  // Observer pattern for memory usage monitoring
  public onMemoryUsageChange(callback: (usage: MemoryUsage) => void): () => void {
    this.observers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.observers.delete(callback);
    };
  }

  // Utility methods
  public getResourceCount(): number {
    return this.resources.size;
  }

  public getResourcesByType(type: ManagedResource['type']): ManagedResource[] {
    return Array.from(this.resources.values()).filter(resource => resource.type === type);
  }

  public getTotalResourceSize(): number {
    let total = 0;
    this.resources.forEach(resource => {
      total += resource.size;
    });
    return total;
  }

  public setThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  public getThresholds(): MemoryThresholds {
    return { ...this.thresholds };
  }

  public destroy(): void {
    this.stopMonitoring();
    
    // Cleanup all resources
    this.resources.forEach((resource, id) => {
      this.unregisterResource(id);
    });
    
    this.observers.clear();
  }
}