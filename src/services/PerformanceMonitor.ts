import { EventEmitter } from 'events';

export interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  networkRequests: number;
  renderTime: number;
  interactionTime: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: number;
}

export interface PerformanceBudget {
  maxLoadTime: number;
  maxMemoryUsage: number;
  maxNetworkRequests: number;
  maxRenderTime: number;
  maxInteractionTime: number;
}

export interface PerformanceAlert {
  type: 'budget_exceeded' | 'memory_leak' | 'slow_interaction' | 'high_error_rate';
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private budget: PerformanceBudget;
  private observer: PerformanceObserver | null = null;
  private memoryCheckInterval: number | null = null;
  private isMonitoring = false;

  constructor(budget: PerformanceBudget) {
    super();
    this.budget = budget;
    this.initializeObserver();
  }

  private initializeObserver(): void {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.processPerformanceEntries(entries);
      });
    }
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Start performance observer
    if (this.observer) {
      this.observer.observe({ 
        entryTypes: ['navigation', 'resource', 'measure', 'paint', 'largest-contentful-paint'] 
      });
    }

    // Start memory monitoring
    this.memoryCheckInterval = window.setInterval(() => {
      this.checkMemoryUsage();
    }, 5000);

    // Monitor user interactions
    this.monitorInteractions();

    console.log('Performance monitoring started');
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    console.log('Performance monitoring stopped');
  }

  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      if (entry.entryType === 'navigation') {
        this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
      } else if (entry.entryType === 'resource') {
        this.recordResourceMetrics(entry as PerformanceResourceTiming);
      } else if (entry.entryType === 'measure') {
        this.recordCustomMetrics(entry);
      }
    });
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const loadTime = entry.loadEventEnd - entry.navigationStart;
    const renderTime = entry.domContentLoadedEventEnd - entry.navigationStart;

    const metrics: PerformanceMetrics = {
      loadTime,
      renderTime,
      memoryUsage: this.getMemoryUsage(),
      networkRequests: performance.getEntriesByType('resource').length,
      interactionTime: 0,
      cacheHitRate: this.calculateCacheHitRate(),
      errorRate: 0,
      timestamp: Date.now()
    };

    this.recordMetrics(metrics);
  }

  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    // Check for slow resources
    const duration = entry.responseEnd - entry.requestStart;
    if (duration > 1000) { // Resources taking more than 1 second
      this.emit('slowResource', {
        name: entry.name,
        duration,
        size: entry.transferSize || 0
      });
    }
  }

  private recordCustomMetrics(entry: PerformanceEntry): void {
    // Handle custom performance measures
    if (entry.name.startsWith('tool-load-')) {
      const toolId = entry.name.replace('tool-load-', '');
      this.emit('toolLoadTime', {
        toolId,
        duration: entry.duration
      });
    }
  }

  private checkMemoryUsage(): void {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage > this.budget.maxMemoryUsage) {
      this.emitAlert({
        type: 'budget_exceeded',
        metric: 'memoryUsage',
        value: memoryUsage,
        threshold: this.budget.maxMemoryUsage,
        timestamp: Date.now(),
        severity: memoryUsage > this.budget.maxMemoryUsage * 1.5 ? 'critical' : 'high'
      });
    }

    // Check for potential memory leaks
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length >= 10) {
      const memoryTrend = this.calculateMemoryTrend(recentMetrics);
      if (memoryTrend > 0.1) { // 10% increase trend
        this.emitAlert({
          type: 'memory_leak',
          metric: 'memoryUsage',
          value: memoryUsage,
          threshold: this.budget.maxMemoryUsage,
          timestamp: Date.now(),
          severity: 'medium'
        });
      }
    }
  }

  private monitorInteractions(): void {
    const interactionTypes = ['click', 'keydown', 'touchstart'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        const startTime = performance.now();
        
        // Use requestIdleCallback to measure interaction response time
        requestIdleCallback(() => {
          const interactionTime = performance.now() - startTime;
          
          if (interactionTime > this.budget.maxInteractionTime) {
            this.emitAlert({
              type: 'slow_interaction',
              metric: 'interactionTime',
              value: interactionTime,
              threshold: this.budget.maxInteractionTime,
              timestamp: Date.now(),
              severity: interactionTime > this.budget.maxInteractionTime * 2 ? 'high' : 'medium'
            });
          }
        });
      }, { passive: true });
    });
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private calculateCacheHitRate(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    if (resources.length === 0) return 0;

    const cachedResources = resources.filter(resource => 
      resource.transferSize === 0 || resource.transferSize < resource.decodedBodySize
    );

    return cachedResources.length / resources.length;
  }

  private calculateMemoryTrend(metrics: PerformanceMetrics[]): number {
    if (metrics.length < 2) return 0;

    const first = metrics[0].memoryUsage;
    const last = metrics[metrics.length - 1].memoryUsage;
    
    return (last - first) / first;
  }

  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 100 metrics to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Check against budget
    this.checkBudget(metrics);
    
    this.emit('metricsRecorded', metrics);
  }

  private checkBudget(metrics: PerformanceMetrics): void {
    const checks = [
      { metric: 'loadTime' as const, value: metrics.loadTime, max: this.budget.maxLoadTime },
      { metric: 'memoryUsage' as const, value: metrics.memoryUsage, max: this.budget.maxMemoryUsage },
      { metric: 'networkRequests' as const, value: metrics.networkRequests, max: this.budget.maxNetworkRequests },
      { metric: 'renderTime' as const, value: metrics.renderTime, max: this.budget.maxRenderTime },
      { metric: 'interactionTime' as const, value: metrics.interactionTime, max: this.budget.maxInteractionTime }
    ];

    checks.forEach(check => {
      if (check.value > check.max) {
        this.emitAlert({
          type: 'budget_exceeded',
          metric: check.metric,
          value: check.value,
          threshold: check.max,
          timestamp: Date.now(),
          severity: check.value > check.max * 1.5 ? 'high' : 'medium'
        });
      }
    });
  }

  private emitAlert(alert: PerformanceAlert): void {
    this.emit('performanceAlert', alert);
    console.warn('Performance Alert:', alert);
  }

  // Public API methods
  public measureToolLoadTime(toolId: string): () => void {
    const startTime = performance.now();
    performance.mark(`tool-load-start-${toolId}`);
    
    return () => {
      performance.mark(`tool-load-end-${toolId}`);
      performance.measure(`tool-load-${toolId}`, `tool-load-start-${toolId}`, `tool-load-end-${toolId}`);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.emit('toolLoadTime', { toolId, duration });
      return duration;
    };
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public getAverageMetrics(count = 10): Partial<PerformanceMetrics> {
    const recentMetrics = this.metrics.slice(-count);
    if (recentMetrics.length === 0) return {};

    const averages = recentMetrics.reduce((acc, metrics) => {
      Object.keys(metrics).forEach(key => {
        if (key !== 'timestamp' && typeof metrics[key as keyof PerformanceMetrics] === 'number') {
          acc[key as keyof PerformanceMetrics] = (acc[key as keyof PerformanceMetrics] || 0) + 
            (metrics[key as keyof PerformanceMetrics] as number);
        }
      });
      return acc;
    }, {} as Partial<PerformanceMetrics>);

    Object.keys(averages).forEach(key => {
      if (typeof averages[key as keyof PerformanceMetrics] === 'number') {
        (averages[key as keyof PerformanceMetrics] as number) /= recentMetrics.length;
      }
    });

    return averages;
  }

  public setBudget(budget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  public getBudget(): PerformanceBudget {
    return { ...this.budget };
  }
}