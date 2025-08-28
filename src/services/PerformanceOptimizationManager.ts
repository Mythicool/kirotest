import { PerformanceMonitor, PerformanceBudget, PerformanceAlert } from './PerformanceMonitor';
import { LazyLoader, LoadableResource } from './LazyLoader';
import { MemoryManager, MemoryThresholds } from './MemoryManager';
import { CacheManager, CacheConfig } from './CacheManager';
import { NetworkOptimizer } from './NetworkOptimizer';
import { ResourceOptimizer, OptimizationConfig } from './ResourceOptimizer';
import { PerformanceTester, PerformanceTest } from './PerformanceTester';

export interface OptimizationSettings {
  performanceBudget: PerformanceBudget;
  memoryThresholds: MemoryThresholds;
  cacheConfig: CacheConfig;
  optimizationConfig: OptimizationConfig;
  enableAutoOptimization: boolean;
  enablePerformanceAlerts: boolean;
  enableResourcePreloading: boolean;
  enableNetworkOptimization: boolean;
}

export interface PerformanceReport {
  timestamp: number;
  overallScore: number;
  metrics: {
    loadTime: number;
    memoryUsage: number;
    cacheHitRate: number;
    networkEfficiency: number;
    resourceOptimization: number;
  };
  recommendations: string[];
  alerts: PerformanceAlert[];
  optimizations: string[];
}

export class PerformanceOptimizationManager {
  private performanceMonitor: PerformanceMonitor;
  private lazyLoader: LazyLoader;
  private memoryManager: MemoryManager;
  private cacheManager: CacheManager;
  private networkOptimizer: NetworkOptimizer;
  private resourceOptimizer: ResourceOptimizer;
  private performanceTester: PerformanceTester;
  
  private settings: OptimizationSettings;
  private isOptimizing = false;
  private optimizationInterval: number | null = null;
  private observers: Set<(report: PerformanceReport) => void> = new Set();

  constructor(settings: Partial<OptimizationSettings> = {}) {
    this.settings = {
      performanceBudget: {
        maxLoadTime: 3000,
        maxMemoryUsage: 100,
        maxNetworkRequests: 50,
        maxRenderTime: 2000,
        maxInteractionTime: 100
      },
      memoryThresholds: {
        warning: 50,
        critical: 100,
        cleanup: 80
      },
      cacheConfig: {
        maxSize: 50 * 1024 * 1024,
        maxEntries: 1000,
        defaultTTL: 30 * 60 * 1000,
        cleanupInterval: 5 * 60 * 1000,
        strategy: 'lru'
      },
      optimizationConfig: {
        minifyCSS: true,
        minifyJS: true,
        minifyHTML: true,
        compressImages: true,
        bundleAssets: true,
        treeshaking: true,
        codesplitting: true,
        lazyLoadImages: true,
        preloadCritical: true
      },
      enableAutoOptimization: true,
      enablePerformanceAlerts: true,
      enableResourcePreloading: true,
      enableNetworkOptimization: true,
      ...settings
    };

    this.initializeServices();
    this.setupEventListeners();
    this.startOptimization();
  }

  private initializeServices(): void {
    this.performanceMonitor = new PerformanceMonitor(this.settings.performanceBudget);
    this.lazyLoader = new LazyLoader();
    this.memoryManager = new MemoryManager(this.settings.memoryThresholds);
    this.cacheManager = new CacheManager(this.settings.cacheConfig);
    this.networkOptimizer = new NetworkOptimizer();
    this.resourceOptimizer = new ResourceOptimizer(this.settings.optimizationConfig);
    this.performanceTester = new PerformanceTester();
  }

  private setupEventListeners(): void {
    // Performance Monitor Events
    this.performanceMonitor.on('performanceAlert', (alert: PerformanceAlert) => {
      if (this.settings.enablePerformanceAlerts) {
        this.handlePerformanceAlert(alert);
      }
    });

    this.performanceMonitor.on('metricsRecorded', () => {
      if (this.settings.enableAutoOptimization) {
        this.scheduleOptimization();
      }
    });

    // Memory Manager Events
    this.memoryManager.onMemoryUsageChange((usage) => {
      if (usage.percentage > 80 && this.settings.enableAutoOptimization) {
        this.performMemoryOptimization();
      }
    });
  }

  private startOptimization(): void {
    if (this.isOptimizing) return;

    this.isOptimizing = true;
    this.performanceMonitor.startMonitoring();
    this.memoryManager.startMonitoring();

    // Run optimization checks every 30 seconds
    this.optimizationInterval = window.setInterval(() => {
      this.runOptimizationCycle();
    }, 30000);

    console.log('Performance optimization started');
  }

  private stopOptimization(): void {
    if (!this.isOptimizing) return;

    this.isOptimizing = false;
    this.performanceMonitor.stopMonitoring();
    this.memoryManager.stopMonitoring();

    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    console.log('Performance optimization stopped');
  }

  private async runOptimizationCycle(): Promise<void> {
    try {
      const report = await this.generatePerformanceReport();
      
      // Apply automatic optimizations based on the report
      if (this.settings.enableAutoOptimization) {
        await this.applyAutomaticOptimizations(report);
      }

      // Notify observers
      this.notifyObservers(report);
    } catch (error) {
      console.warn('Optimization cycle failed:', error);
    }
  }

  private async handlePerformanceAlert(alert: PerformanceAlert): Promise<void> {
    console.warn('Performance Alert:', alert);

    switch (alert.type) {
      case 'budget_exceeded':
        await this.handleBudgetExceeded(alert);
        break;
      case 'memory_leak':
        await this.handleMemoryLeak(alert);
        break;
      case 'slow_interaction':
        await this.handleSlowInteraction(alert);
        break;
      case 'high_error_rate':
        await this.handleHighErrorRate(alert);
        break;
    }
  }

  private async handleBudgetExceeded(alert: PerformanceAlert): Promise<void> {
    switch (alert.metric) {
      case 'loadTime':
        await this.optimizeLoadTime();
        break;
      case 'memoryUsage':
        await this.performMemoryOptimization();
        break;
      case 'networkRequests':
        await this.optimizeNetworkRequests();
        break;
    }
  }

  private async handleMemoryLeak(alert: PerformanceAlert): Promise<void> {
    // Aggressive memory cleanup
    this.memoryManager.cleanupCache();
    this.memoryManager.cleanupImages();
    this.memoryManager.cleanupWorkers();
    this.cacheManager.clear();
  }

  private async handleSlowInteraction(alert: PerformanceAlert): Promise<void> {
    // Preload critical resources
    this.lazyLoader.preloadByPriority('critical');
    this.lazyLoader.preloadByPriority('high');
  }

  private async handleHighErrorRate(alert: PerformanceAlert): Promise<void> {
    // Clear network cache to force fresh requests
    this.networkOptimizer.clearCache();
  }

  private async optimizeLoadTime(): Promise<void> {
    // Preload critical resources
    if (this.settings.enableResourcePreloading) {
      this.lazyLoader.preloadByPriority('critical');
    }

    // Optimize network requests
    if (this.settings.enableNetworkOptimization) {
      // Network optimization is handled automatically by NetworkOptimizer
    }
  }

  private async performMemoryOptimization(): Promise<void> {
    // Clean up memory
    this.memoryManager.cleanupCache();
    this.memoryManager.cleanupImages();
    
    // Clear old cache entries
    const cacheStats = this.cacheManager.getStats();
    if (cacheStats.memoryUsage > 30 * 1024 * 1024) { // 30MB
      this.cacheManager.clear();
    }

    // Clear lazy loader cache
    this.lazyLoader.clearCache();
  }

  private async optimizeNetworkRequests(): Promise<void> {
    // Network optimization is handled automatically by NetworkOptimizer
    // Additional optimizations can be added here
  }

  private scheduleOptimization(): void {
    // Debounced optimization scheduling
    if (this.optimizationInterval) {
      clearTimeout(this.optimizationInterval);
    }

    this.optimizationInterval = window.setTimeout(() => {
      this.runOptimizationCycle();
    }, 5000);
  }

  private async applyAutomaticOptimizations(report: PerformanceReport): Promise<void> {
    const optimizations: string[] = [];

    // Memory optimization
    if (report.metrics.memoryUsage > 80) {
      await this.performMemoryOptimization();
      optimizations.push('Memory cleanup performed');
    }

    // Cache optimization
    if (report.metrics.cacheHitRate < 50) {
      // Preload frequently accessed resources
      this.lazyLoader.preloadByPriority('medium');
      optimizations.push('Resource preloading increased');
    }

    // Network optimization
    if (report.metrics.networkEfficiency < 70) {
      // Clear network cache to improve efficiency
      this.networkOptimizer.clearCache();
      optimizations.push('Network cache cleared');
    }

    if (optimizations.length > 0) {
      console.log('Applied automatic optimizations:', optimizations);
    }
  }

  public async generatePerformanceReport(): Promise<PerformanceReport> {
    const performanceMetrics = this.performanceMonitor.getLatestMetrics();
    const memoryUsage = this.memoryManager.getMemoryUsage();
    const cacheStats = this.cacheManager.getStats();
    const networkStats = this.networkOptimizer.getStats();

    // Calculate metrics
    const loadTime = performanceMetrics?.loadTime || 0;
    const memoryUsagePercent = memoryUsage.percentage;
    const cacheHitRate = cacheStats.hitRate;
    const networkEfficiency = this.calculateNetworkEfficiency(networkStats);
    const resourceOptimization = this.calculateResourceOptimization();

    // Calculate overall score (0-100)
    const overallScore = this.calculateOverallScore({
      loadTime,
      memoryUsage: memoryUsagePercent,
      cacheHitRate,
      networkEfficiency,
      resourceOptimization
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      loadTime,
      memoryUsage: memoryUsagePercent,
      cacheHitRate,
      networkEfficiency,
      resourceOptimization
    });

    return {
      timestamp: Date.now(),
      overallScore,
      metrics: {
        loadTime,
        memoryUsage: memoryUsagePercent,
        cacheHitRate,
        networkEfficiency,
        resourceOptimization
      },
      recommendations,
      alerts: [], // Would be populated with recent alerts
      optimizations: [] // Would be populated with recent optimizations
    };
  }

  private calculateNetworkEfficiency(networkStats: any): number {
    // Calculate network efficiency based on success rate and response times
    const successRate = (networkStats.successfulRequests / networkStats.totalRequests) * 100;
    const responseTimeScore = Math.max(0, 100 - (networkStats.averageResponseTime / 50));
    
    return (successRate + responseTimeScore) / 2;
  }

  private calculateResourceOptimization(): number {
    // Calculate resource optimization score based on bundle compression ratios
    const bundles = this.resourceOptimizer.getAllBundles();
    if (bundles.length === 0) return 100;

    const averageCompression = bundles.reduce((sum, bundle) => 
      sum + bundle.compressionRatio, 0) / bundles.length;
    
    return Math.min(100, averageCompression * 2); // Scale to 0-100
  }

  private calculateOverallScore(metrics: any): number {
    const weights = {
      loadTime: 0.3,
      memoryUsage: 0.2,
      cacheHitRate: 0.2,
      networkEfficiency: 0.15,
      resourceOptimization: 0.15
    };

    // Normalize metrics to 0-100 scale
    const normalizedMetrics = {
      loadTime: Math.max(0, 100 - (metrics.loadTime / 50)), // 5000ms = 0 score
      memoryUsage: Math.max(0, 100 - metrics.memoryUsage),
      cacheHitRate: metrics.cacheHitRate,
      networkEfficiency: metrics.networkEfficiency,
      resourceOptimization: metrics.resourceOptimization
    };

    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (normalizedMetrics[metric as keyof typeof normalizedMetrics] * weight);
    }, 0);
  }

  private generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.loadTime > 3000) {
      recommendations.push('Consider enabling resource preloading to improve load times');
    }

    if (metrics.memoryUsage > 80) {
      recommendations.push('Memory usage is high - consider clearing unused resources');
    }

    if (metrics.cacheHitRate < 50) {
      recommendations.push('Cache hit rate is low - consider preloading frequently used resources');
    }

    if (metrics.networkEfficiency < 70) {
      recommendations.push('Network efficiency is low - check for failed requests or slow responses');
    }

    if (metrics.resourceOptimization < 50) {
      recommendations.push('Resource optimization is low - consider enabling minification and compression');
    }

    return recommendations;
  }

  // Public API methods
  public registerResource(resource: LoadableResource): void {
    this.lazyLoader.registerResource(resource);
  }

  public async loadResource(resourceId: string): Promise<any> {
    return this.lazyLoader.loadResource(resourceId);
  }

  public preloadResource(resourceId: string): void {
    this.lazyLoader.preloadResource(resourceId);
  }

  public async optimizeAsset(content: string, type: 'css' | 'js' | 'html'): Promise<any> {
    switch (type) {
      case 'css':
        return this.resourceOptimizer.optimizeCSS(content);
      case 'js':
        return this.resourceOptimizer.optimizeJS(content);
      case 'html':
        return this.resourceOptimizer.optimizeHTML(content);
    }
  }

  public createPerformanceTest(type: 'load' | 'stress' | 'endurance', config: any): PerformanceTest {
    switch (type) {
      case 'load':
        return this.performanceTester.createLoadTest(config);
      case 'stress':
        return this.performanceTester.createStressTest(config);
      case 'endurance':
        return this.performanceTester.createEnduranceTest(config);
    }
  }

  public async runPerformanceTest(testId: string): Promise<void> {
    return this.performanceTester.runTest(testId);
  }

  public getPerformanceMetrics(): any {
    return this.performanceMonitor.getLatestMetrics();
  }

  public getMemoryUsage(): any {
    return this.memoryManager.getMemoryUsage();
  }

  public getCacheStats(): any {
    return this.cacheManager.getStats();
  }

  public getNetworkStats(): any {
    return this.networkOptimizer.getStats();
  }

  public updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Update service configurations
    this.performanceMonitor.setBudget(this.settings.performanceBudget);
    this.memoryManager.setThresholds(this.settings.memoryThresholds);
    this.cacheManager.updateConfig(this.settings.cacheConfig);
    this.resourceOptimizer.updateConfig(this.settings.optimizationConfig);
  }

  public onPerformanceReport(callback: (report: PerformanceReport) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(report: PerformanceReport): void {
    this.observers.forEach(observer => observer(report));
  }

  public destroy(): void {
    this.stopOptimization();
    
    this.performanceMonitor.stopMonitoring();
    this.memoryManager.destroy();
    this.cacheManager.destroy();
    this.networkOptimizer.destroy();
    this.resourceOptimizer.destroy();
    this.performanceTester.destroy();
    this.lazyLoader.destroy();
    
    this.observers.clear();
  }
}