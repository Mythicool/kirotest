import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PerformanceOptimizationManager } from '../../services/PerformanceOptimizationManager';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';
import { LazyLoader } from '../../services/LazyLoader';
import { MemoryManager } from '../../services/MemoryManager';
import { CacheManager } from '../../services/CacheManager';
import { NetworkOptimizer } from '../../services/NetworkOptimizer';
import { ResourceOptimizer } from '../../services/ResourceOptimizer';
import { PerformanceTester } from '../../services/PerformanceTester';

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024
    }
  },
  writable: true
});

Object.defineProperty(window, 'PerformanceObserver', {
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn()
  })),
  writable: true
});

Object.defineProperty(window, 'IntersectionObserver', {
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  })),
  writable: true
});

Object.defineProperty(window, 'requestIdleCallback', {
  value: jest.fn((callback) => setTimeout(callback, 0)),
  writable: true
});

Object.defineProperty(window, 'cancelIdleCallback', {
  value: jest.fn(),
  writable: true
});

describe('Performance Optimization System', () => {
  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor({
        maxLoadTime: 3000,
        maxMemoryUsage: 100,
        maxNetworkRequests: 50,
        maxRenderTime: 2000,
        maxInteractionTime: 100
      });
    });

    afterEach(() => {
      monitor.stopMonitoring();
    });

    it('should start and stop monitoring', () => {
      expect(() => monitor.startMonitoring()).not.toThrow();
      expect(() => monitor.stopMonitoring()).not.toThrow();
    });

    it('should measure tool load time', () => {
      const endMeasurement = monitor.measureToolLoadTime('test-tool');
      expect(typeof endMeasurement).toBe('function');
      
      const duration = endMeasurement();
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should get performance metrics', () => {
      const metrics = monitor.getLatestMetrics();
      expect(metrics).toBeNull(); // No metrics recorded yet
      
      const allMetrics = monitor.getMetrics();
      expect(Array.isArray(allMetrics)).toBe(true);
    });

    it('should update performance budget', () => {
      const newBudget = { maxLoadTime: 5000 };
      monitor.setBudget(newBudget);
      
      const budget = monitor.getBudget();
      expect(budget.maxLoadTime).toBe(5000);
    });
  });

  describe('LazyLoader', () => {
    let loader: LazyLoader;

    beforeEach(() => {
      loader = new LazyLoader();
    });

    afterEach(() => {
      loader.destroy();
    });

    it('should register and load resources', async () => {
      const resource = {
        id: 'test-resource',
        type: 'component' as const,
        loader: () => Promise.resolve({ name: 'Test Component' }),
        priority: 'medium' as const
      };

      loader.registerResource(resource);
      
      const result = await loader.loadResource('test-resource');
      expect(result).toEqual({ name: 'Test Component' });
      expect(loader.isLoaded('test-resource')).toBe(true);
    });

    it('should handle resource loading errors', async () => {
      const resource = {
        id: 'error-resource',
        type: 'component' as const,
        loader: () => Promise.reject(new Error('Load failed')),
        priority: 'medium' as const
      };

      loader.registerResource(resource);
      
      await expect(loader.loadResource('error-resource')).rejects.toThrow('Load failed');
    });

    it('should preload resources by priority', () => {
      const highPriorityResource = {
        id: 'high-priority',
        type: 'component' as const,
        loader: () => Promise.resolve({ name: 'High Priority' }),
        priority: 'high' as const
      };

      loader.registerResource(highPriorityResource);
      expect(() => loader.preloadByPriority('high')).not.toThrow();
    });

    it('should get loading state', () => {
      const resource = {
        id: 'state-resource',
        type: 'component' as const,
        loader: () => Promise.resolve({ name: 'State Test' }),
        priority: 'medium' as const
      };

      loader.registerResource(resource);
      
      const state = loader.getLoadingState('state-resource');
      expect(state).toEqual({ status: 'idle' });
    });
  });

  describe('MemoryManager', () => {
    let memoryManager: MemoryManager;

    beforeEach(() => {
      memoryManager = new MemoryManager({
        warning: 50,
        critical: 100,
        cleanup: 80
      });
    });

    afterEach(() => {
      memoryManager.destroy();
    });

    it('should register and unregister resources', () => {
      const resource = {
        id: 'test-resource',
        type: 'component' as const,
        size: 1024,
        lastAccessed: Date.now(),
        priority: 'medium' as const,
        cleanup: jest.fn()
      };

      memoryManager.registerResource(resource);
      expect(memoryManager.getResourceCount()).toBe(1);

      memoryManager.unregisterResource('test-resource');
      expect(memoryManager.getResourceCount()).toBe(0);
      expect(resource.cleanup).toHaveBeenCalled();
    });

    it('should get memory usage', () => {
      const usage = memoryManager.getMemoryUsage();
      expect(usage).toHaveProperty('used');
      expect(usage).toHaveProperty('total');
      expect(usage).toHaveProperty('limit');
      expect(usage).toHaveProperty('percentage');
    });

    it('should cleanup resources by type', () => {
      const imageResource = {
        id: 'image-resource',
        type: 'image' as const,
        size: 1024,
        lastAccessed: Date.now(),
        priority: 'low' as const,
        cleanup: jest.fn()
      };

      memoryManager.registerResource(imageResource);
      memoryManager.cleanupImages();
      
      expect(imageResource.cleanup).toHaveBeenCalled();
    });

    it('should handle memory usage monitoring', () => {
      const callback = jest.fn();
      const unsubscribe = memoryManager.onMemoryUsageChange(callback);
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('CacheManager', () => {
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager({
        maxSize: 10 * 1024 * 1024,
        maxEntries: 100,
        defaultTTL: 60000,
        cleanupInterval: 30000,
        strategy: 'lru'
      });
    });

    afterEach(() => {
      cacheManager.destroy();
    });

    it('should set and get cache entries', () => {
      const testData = { message: 'Hello, World!' };
      cacheManager.set('test-key', testData);
      
      const retrieved = cacheManager.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should handle cache expiration', async () => {
      const testData = { message: 'Expires soon' };
      cacheManager.set('expire-key', testData, 100); // 100ms TTL
      
      expect(cacheManager.get('expire-key')).toEqual(testData);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cacheManager.get('expire-key')).toBeNull();
    });

    it('should support cache operations by tag', () => {
      cacheManager.set('tagged-1', 'data1', undefined, ['group1']);
      cacheManager.set('tagged-2', 'data2', undefined, ['group1']);
      cacheManager.set('tagged-3', 'data3', undefined, ['group2']);
      
      const group1Items = cacheManager.getByTag('group1');
      expect(group1Items).toHaveLength(2);
      
      const deletedCount = cacheManager.deleteByTag('group1');
      expect(deletedCount).toBe(2);
    });

    it('should provide cache statistics', () => {
      cacheManager.set('stats-test', 'data');
      cacheManager.get('stats-test'); // Hit
      cacheManager.get('non-existent'); // Miss
      
      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.entryCount).toBe(1);
    });

    it('should support memoization', () => {
      let callCount = 0;
      const expensiveFunction = (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoized = cacheManager.memoize(expensiveFunction);
      
      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10); // Should use cache
      expect(callCount).toBe(1);
    });
  });

  describe('NetworkOptimizer', () => {
    let networkOptimizer: NetworkOptimizer;

    beforeEach(() => {
      networkOptimizer = new NetworkOptimizer();
      
      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve({ success: true })
        } as Response)
      );
    });

    afterEach(() => {
      networkOptimizer.destroy();
      jest.restoreAllMocks();
    });

    it('should make GET requests', async () => {
      const response = await networkOptimizer.get('/api/test');
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
    });

    it('should make POST requests', async () => {
      const testData = { message: 'Hello' };
      const response = await networkOptimizer.post('/api/test', testData);
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
    });

    it('should provide network statistics', () => {
      const stats = networkOptimizer.getStats();
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('successfulRequests');
      expect(stats).toHaveProperty('failedRequests');
    });

    it('should handle request cancellation', () => {
      const requestPromise = networkOptimizer.get('/api/slow');
      const requestId = 'test-request-id';
      
      expect(networkOptimizer.cancelRequest(requestId)).toBe(false); // Not found
      networkOptimizer.cancelAllRequests();
    });
  });

  describe('ResourceOptimizer', () => {
    let resourceOptimizer: ResourceOptimizer;

    beforeEach(() => {
      resourceOptimizer = new ResourceOptimizer({
        minifyCSS: true,
        minifyJS: true,
        minifyHTML: true,
        compressImages: true,
        bundleAssets: true,
        treeshaking: true,
        codesplitting: true,
        lazyLoadImages: true,
        preloadCritical: true
      });
    });

    afterEach(() => {
      resourceOptimizer.destroy();
    });

    it('should optimize CSS', async () => {
      const css = `
        .container {
          display: flex;
          padding: 20px;
        }
        /* This is a comment */
        .button {
          background: blue;
        }
      `;

      const result = await resourceOptimizer.optimizeCSS(css);
      expect(result.originalSize).toBeGreaterThan(result.optimizedSize);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.optimizations).toContain('CSS minification');
    });

    it('should optimize JavaScript', async () => {
      const js = `
        function test() {
          // This is a comment
          const message = "Hello World";
          console.log(message);
        }
        
        function unused() {
          return "This function is not used";
        }
      `;

      const result = await resourceOptimizer.optimizeJS(js, { usedFunctions: ['test'] });
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.optimizations).toContain('JavaScript minification');
    });

    it('should optimize HTML', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test</title>
        </head>
        <body>
          <!-- This is a comment -->
          <div class="container">
            <img src="image.jpg" alt="Test">
            <p>Hello World</p>
          </div>
        </body>
        </html>
      `;

      const result = await resourceOptimizer.optimizeHTML(html);
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.optimizations).toContain('HTML minification');
    });

    it('should create asset bundles', async () => {
      const assets = [
        '.container { padding: 20px; }',
        '.button { background: blue; }'
      ];

      const bundle = await resourceOptimizer.createBundle(assets, 'css');
      expect(bundle.type).toBe('css');
      expect(bundle.assets).toEqual(assets);
      expect(bundle.originalSize).toBeGreaterThan(0);
    });

    it('should generate code split points', () => {
      const code = `
        function func1() { return 1; }
        function func2() { return 2; }
        function func3() { return 3; }
      `;

      const chunks = resourceOptimizer.generateCodeSplitPoints(code);
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('PerformanceTester', () => {
    let performanceTester: PerformanceTester;

    beforeEach(() => {
      performanceTester = new PerformanceTester();
    });

    afterEach(() => {
      performanceTester.destroy();
    });

    it('should create load tests', () => {
      const test = performanceTester.createLoadTest({
        duration: 30000,
        concurrency: 10,
        targetUrl: '/api/test'
      });

      expect(test.type).toBe('load');
      expect(test.status).toBe('pending');
      expect(test.config.duration).toBe(30000);
    });

    it('should create stress tests', () => {
      const test = performanceTester.createStressTest({
        duration: 60000,
        concurrency: 50
      });

      expect(test.type).toBe('stress');
      expect(test.config.concurrency).toBe(50);
    });

    it('should create endurance tests', () => {
      const test = performanceTester.createEnduranceTest({
        duration: 300000,
        concurrency: 20
      });

      expect(test.type).toBe('endurance');
      expect(test.config.duration).toBe(300000);
    });

    it('should manage test lifecycle', () => {
      const test = performanceTester.createLoadTest({});
      
      expect(performanceTester.getTest(test.id)).toBe(test);
      expect(performanceTester.getAllTests()).toContain(test);
      
      performanceTester.deleteTest(test.id);
      expect(performanceTester.getTest(test.id)).toBeNull();
    });

    it('should create website load tests', () => {
      const test = performanceTester.createWebsiteLoadTest('https://example.com');
      
      expect(test.type).toBe('load');
      expect(test.config.scenarios[0].name).toBe('Website Load Test');
    });

    it('should create API load tests', () => {
      const endpoints = ['/api/users', '/api/posts', '/api/comments'];
      const test = performanceTester.createAPILoadTest('https://api.example.com', endpoints);
      
      expect(test.type).toBe('load');
      expect(test.config.scenarios[0].actions).toHaveLength(3);
    });
  });

  describe('PerformanceOptimizationManager', () => {
    let manager: PerformanceOptimizationManager;

    beforeEach(() => {
      manager = new PerformanceOptimizationManager({
        enableAutoOptimization: true,
        enablePerformanceAlerts: true,
        enableResourcePreloading: true,
        enableNetworkOptimization: true
      });
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should generate performance reports', async () => {
      const report = await manager.generatePerformanceReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('overallScore');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('recommendations');
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
    });

    it('should register and load resources', async () => {
      const resource = {
        id: 'manager-test-resource',
        type: 'component' as const,
        loader: () => Promise.resolve({ name: 'Manager Test' }),
        priority: 'high' as const
      };

      manager.registerResource(resource);
      const result = await manager.loadResource('manager-test-resource');
      
      expect(result).toEqual({ name: 'Manager Test' });
    });

    it('should optimize assets', async () => {
      const css = '.test { color: red; }';
      const result = await manager.optimizeAsset(css, 'css');
      
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('optimizedSize');
      expect(result).toHaveProperty('compressionRatio');
    });

    it('should create and run performance tests', async () => {
      const test = manager.createPerformanceTest('load', {
        duration: 10000,
        concurrency: 5
      });

      expect(test.type).toBe('load');
      expect(test.status).toBe('pending');
    });

    it('should provide system metrics', () => {
      const performanceMetrics = manager.getPerformanceMetrics();
      const memoryUsage = manager.getMemoryUsage();
      const cacheStats = manager.getCacheStats();
      const networkStats = manager.getNetworkStats();

      expect(memoryUsage).toHaveProperty('used');
      expect(cacheStats).toHaveProperty('hits');
      expect(networkStats).toHaveProperty('totalRequests');
    });

    it('should update settings', () => {
      const newSettings = {
        enableAutoOptimization: false,
        performanceBudget: {
          maxLoadTime: 5000,
          maxMemoryUsage: 150,
          maxNetworkRequests: 100,
          maxRenderTime: 3000,
          maxInteractionTime: 200
        }
      };

      expect(() => manager.updateSettings(newSettings)).not.toThrow();
    });

    it('should handle performance report subscriptions', () => {
      const callback = jest.fn();
      const unsubscribe = manager.onPerformanceReport(callback);
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });
});