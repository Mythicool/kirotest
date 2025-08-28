export interface LoadableResource {
  id: string;
  type: 'component' | 'script' | 'style' | 'image' | 'tool';
  url?: string;
  loader: () => Promise<any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[];
  preloadConditions?: PreloadCondition[];
}

export interface PreloadCondition {
  type: 'user_action' | 'viewport' | 'idle' | 'network' | 'time';
  value?: any;
}

export interface LoadingState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  progress?: number;
  error?: Error;
  loadTime?: number;
}

export class LazyLoader {
  private resources = new Map<string, LoadableResource>();
  private loadingStates = new Map<string, LoadingState>();
  private loadedResources = new Set<string>();
  private preloadQueue = new Set<string>();
  private intersectionObserver: IntersectionObserver | null = null;
  private idleCallback: number | null = null;
  private networkInfo: any = null;

  constructor() {
    this.initializeObservers();
    this.initializeNetworkInfo();
  }

  private initializeObservers(): void {
    // Intersection Observer for viewport-based preloading
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const resourceId = entry.target.getAttribute('data-resource-id');
              if (resourceId) {
                this.preloadResource(resourceId);
              }
            }
          });
        },
        { rootMargin: '50px' }
      );
    }
  }

  private initializeNetworkInfo(): void {
    // Network Information API for adaptive loading
    if ('connection' in navigator) {
      this.networkInfo = (navigator as any).connection;
    }
  }

  public registerResource(resource: LoadableResource): void {
    this.resources.set(resource.id, resource);
    this.loadingStates.set(resource.id, { status: 'idle' });

    // Check if resource should be preloaded immediately
    this.evaluatePreloadConditions(resource);
  }

  public async loadResource(resourceId: string): Promise<any> {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }

    // Return cached resource if already loaded
    if (this.loadedResources.has(resourceId)) {
      return this.getCachedResource(resourceId);
    }

    // Check if already loading
    const currentState = this.loadingStates.get(resourceId);
    if (currentState?.status === 'loading') {
      return this.waitForLoad(resourceId);
    }

    return this.performLoad(resource);
  }

  private async performLoad(resource: LoadableResource): Promise<any> {
    const startTime = performance.now();
    
    this.updateLoadingState(resource.id, { status: 'loading', progress: 0 });

    try {
      // Load dependencies first
      if (resource.dependencies) {
        await this.loadDependencies(resource.dependencies);
      }

      // Perform the actual load
      const result = await this.executeLoader(resource);
      
      const loadTime = performance.now() - startTime;
      this.loadedResources.add(resource.id);
      this.updateLoadingState(resource.id, { 
        status: 'loaded', 
        progress: 100,
        loadTime 
      });

      // Cache the result
      this.cacheResource(resource.id, result);

      return result;
    } catch (error) {
      this.updateLoadingState(resource.id, { 
        status: 'error', 
        error: error as Error 
      });
      throw error;
    }
  }

  private async executeLoader(resource: LoadableResource): Promise<any> {
    switch (resource.type) {
      case 'component':
        return this.loadComponent(resource);
      case 'script':
        return this.loadScript(resource);
      case 'style':
        return this.loadStyle(resource);
      case 'image':
        return this.loadImage(resource);
      case 'tool':
        return this.loadTool(resource);
      default:
        return resource.loader();
    }
  }

  private async loadComponent(resource: LoadableResource): Promise<any> {
    // Dynamic import for React components
    const module = await resource.loader();
    return module.default || module;
  }

  private async loadScript(resource: LoadableResource): Promise<any> {
    if (!resource.url) {
      return resource.loader();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = resource.url!;
      script.async = true;
      
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load script: ${resource.url}`));
      
      document.head.appendChild(script);
    });
  }

  private async loadStyle(resource: LoadableResource): Promise<any> {
    if (!resource.url) {
      return resource.loader();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = resource.url!;
      
      link.onload = () => resolve(link);
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${resource.url}`));
      
      document.head.appendChild(link);
    });
  }

  private async loadImage(resource: LoadableResource): Promise<HTMLImageElement> {
    if (!resource.url) {
      return resource.loader();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${resource.url}`));
      img.src = resource.url!;
    });
  }

  private async loadTool(resource: LoadableResource): Promise<any> {
    // Special handling for tool loading with iframe preparation
    const result = await resource.loader();
    
    // Prepare iframe container if needed
    if (result.requiresIframe) {
      this.prepareIframeContainer(resource.id);
    }
    
    return result;
  }

  private prepareIframeContainer(resourceId: string): void {
    const container = document.createElement('div');
    container.id = `tool-container-${resourceId}`;
    container.style.display = 'none';
    document.body.appendChild(container);
  }

  private async loadDependencies(dependencies: string[]): Promise<void> {
    const loadPromises = dependencies.map(dep => this.loadResource(dep));
    await Promise.all(loadPromises);
  }

  private evaluatePreloadConditions(resource: LoadableResource): void {
    if (!resource.preloadConditions) return;

    resource.preloadConditions.forEach(condition => {
      switch (condition.type) {
        case 'idle':
          this.scheduleIdlePreload(resource.id);
          break;
        case 'time':
          this.scheduleTimeBasedPreload(resource.id, condition.value);
          break;
        case 'network':
          this.evaluateNetworkCondition(resource.id, condition.value);
          break;
        case 'user_action':
          this.setupUserActionPreload(resource.id, condition.value);
          break;
      }
    });
  }

  private scheduleIdlePreload(resourceId: string): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.preloadResource(resourceId);
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.preloadResource(resourceId);
      }, 100);
    }
  }

  private scheduleTimeBasedPreload(resourceId: string, delay: number): void {
    setTimeout(() => {
      this.preloadResource(resourceId);
    }, delay);
  }

  private evaluateNetworkCondition(resourceId: string, condition: any): void {
    if (!this.networkInfo) return;

    const effectiveType = this.networkInfo.effectiveType;
    const shouldPreload = condition.minSpeed ? 
      this.isNetworkFastEnough(effectiveType, condition.minSpeed) : true;

    if (shouldPreload) {
      this.preloadResource(resourceId);
    }
  }

  private isNetworkFastEnough(effectiveType: string, minSpeed: string): boolean {
    const speedOrder = ['slow-2g', '2g', '3g', '4g'];
    const currentIndex = speedOrder.indexOf(effectiveType);
    const minIndex = speedOrder.indexOf(minSpeed);
    
    return currentIndex >= minIndex;
  }

  private setupUserActionPreload(resourceId: string, action: string): void {
    const handler = () => {
      this.preloadResource(resourceId);
      document.removeEventListener(action, handler);
    };
    
    document.addEventListener(action, handler, { once: true, passive: true });
  }

  public preloadResource(resourceId: string): void {
    if (this.preloadQueue.has(resourceId) || this.loadedResources.has(resourceId)) {
      return;
    }

    this.preloadQueue.add(resourceId);
    
    // Use low priority for preloading
    if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
      (window as any).scheduler.postTask(() => {
        this.loadResource(resourceId).catch(console.warn);
      }, { priority: 'background' });
    } else {
      // Fallback using setTimeout
      setTimeout(() => {
        this.loadResource(resourceId).catch(console.warn);
      }, 0);
    }
  }

  public observeElement(element: Element, resourceId: string): void {
    if (this.intersectionObserver) {
      element.setAttribute('data-resource-id', resourceId);
      this.intersectionObserver.observe(element);
    }
  }

  public unobserveElement(element: Element): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  private updateLoadingState(resourceId: string, state: Partial<LoadingState>): void {
    const currentState = this.loadingStates.get(resourceId) || { status: 'idle' };
    this.loadingStates.set(resourceId, { ...currentState, ...state });
  }

  private async waitForLoad(resourceId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const checkState = () => {
        const state = this.loadingStates.get(resourceId);
        if (state?.status === 'loaded') {
          resolve(this.getCachedResource(resourceId));
        } else if (state?.status === 'error') {
          reject(state.error);
        } else {
          setTimeout(checkState, 10);
        }
      };
      checkState();
    });
  }

  private cacheResource(resourceId: string, resource: any): void {
    // Simple in-memory cache - could be extended with IndexedDB for persistence
    (window as any).__lazyLoaderCache = (window as any).__lazyLoaderCache || new Map();
    (window as any).__lazyLoaderCache.set(resourceId, resource);
  }

  private getCachedResource(resourceId: string): any {
    const cache = (window as any).__lazyLoaderCache;
    return cache ? cache.get(resourceId) : null;
  }

  public getLoadingState(resourceId: string): LoadingState | null {
    return this.loadingStates.get(resourceId) || null;
  }

  public isLoaded(resourceId: string): boolean {
    return this.loadedResources.has(resourceId);
  }

  public preloadByPriority(priority: LoadableResource['priority']): void {
    this.resources.forEach((resource, id) => {
      if (resource.priority === priority && !this.loadedResources.has(id)) {
        this.preloadResource(id);
      }
    });
  }

  public clearCache(): void {
    this.loadedResources.clear();
    this.loadingStates.clear();
    if ((window as any).__lazyLoaderCache) {
      (window as any).__lazyLoaderCache.clear();
    }
  }

  public destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.idleCallback) {
      cancelIdleCallback(this.idleCallback);
    }
    
    this.clearCache();
  }
}