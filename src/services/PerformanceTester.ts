export interface PerformanceTest {
  id: string;
  name: string;
  type: 'load' | 'stress' | 'endurance' | 'spike' | 'volume';
  config: TestConfig;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: TestResults;
  startTime?: number;
  endTime?: number;
}

export interface TestConfig {
  duration: number; // Test duration in milliseconds
  concurrency: number; // Number of concurrent users/requests
  rampUpTime: number; // Time to reach full concurrency
  targetUrl?: string; // URL to test (for load tests)
  scenarios: TestScenario[];
  thresholds: PerformanceThresholds;
}

export interface TestScenario {
  name: string;
  weight: number; // Percentage of traffic
  actions: TestAction[];
}

export interface TestAction {
  type: 'navigate' | 'click' | 'type' | 'wait' | 'scroll' | 'api_call';
  target?: string;
  value?: string;
  duration?: number;
  url?: string;
  method?: string;
  payload?: any;
}

export interface PerformanceThresholds {
  maxResponseTime: number;
  maxErrorRate: number; // Percentage
  minThroughput: number; // Requests per second
  maxMemoryUsage: number; // MB
  maxCPUUsage: number; // Percentage
}

export interface TestResults {
  summary: TestSummary;
  metrics: PerformanceMetrics[];
  errors: TestError[];
  recommendations: string[];
}

export interface TestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number;
  errorRate: number;
  peakMemoryUsage: number;
  averageCPUUsage: number;
}

export interface PerformanceMetrics {
  timestamp: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeUsers: number;
  throughput: number;
  errorCount: number;
}

export interface TestError {
  timestamp: number;
  type: string;
  message: string;
  url?: string;
  statusCode?: number;
}

export class PerformanceTester {
  private tests = new Map<string, PerformanceTest>();
  private activeTests = new Set<string>();
  private workers = new Map<string, Worker[]>();
  private observers: Set<(test: PerformanceTest) => void> = new Set();

  constructor() {
    this.initializeTestWorkers();
  }

  private initializeTestWorkers(): void {
    // Create worker pool for running performance tests
    const workerCode = `
      let testConfig = null;
      let isRunning = false;
      let startTime = 0;
      let metrics = [];
      let errors = [];
      let requestCount = 0;
      let successCount = 0;
      let failureCount = 0;

      function generateMetrics() {
        return {
          timestamp: Date.now(),
          responseTime: Math.random() * 1000 + 100, // 100-1100ms
          memoryUsage: Math.random() * 50 + 20, // 20-70MB
          cpuUsage: Math.random() * 80 + 10, // 10-90%
          activeUsers: Math.floor(Math.random() * testConfig.concurrency) + 1,
          throughput: Math.random() * 100 + 50, // 50-150 RPS
          errorCount: Math.floor(Math.random() * 5)
        };
      }

      function simulateRequest(action) {
        return new Promise((resolve, reject) => {
          const responseTime = Math.random() * 1000 + 100;
          
          setTimeout(() => {
            requestCount++;
            
            // Simulate some failures (5% error rate)
            if (Math.random() < 0.05) {
              failureCount++;
              const error = {
                timestamp: Date.now(),
                type: 'HTTP_ERROR',
                message: 'Request failed',
                url: action.url || 'unknown',
                statusCode: 500
              };
              errors.push(error);
              reject(error);
            } else {
              successCount++;
              resolve({
                responseTime,
                status: 200,
                data: 'Success'
              });
            }
          }, responseTime);
        });
      }

      async function runScenario(scenario) {
        for (const action of scenario.actions) {
          if (!isRunning) break;
          
          try {
            await simulateRequest(action);
          } catch (error) {
            // Error already logged in simulateRequest
          }
          
          // Add some delay between actions
          if (action.duration) {
            await new Promise(resolve => setTimeout(resolve, action.duration));
          }
        }
      }

      async function runTest() {
        startTime = Date.now();
        const endTime = startTime + testConfig.duration;
        
        // Metrics collection interval
        const metricsInterval = setInterval(() => {
          if (isRunning) {
            metrics.push(generateMetrics());
          }
        }, 1000);

        // Run scenarios concurrently
        const promises = [];
        for (let i = 0; i < testConfig.concurrency; i++) {
          const scenario = testConfig.scenarios[i % testConfig.scenarios.length];
          promises.push(runScenario(scenario));
        }

        // Wait for test duration or completion
        await Promise.race([
          Promise.all(promises),
          new Promise(resolve => setTimeout(resolve, testConfig.duration))
        ]);

        clearInterval(metricsInterval);
        isRunning = false;

        // Send final results
        self.postMessage({
          type: 'test_completed',
          results: {
            summary: {
              totalRequests: requestCount,
              successfulRequests: successCount,
              failedRequests: failureCount,
              averageResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
              minResponseTime: Math.min(...metrics.map(m => m.responseTime)),
              maxResponseTime: Math.max(...metrics.map(m => m.responseTime)),
              throughput: requestCount / ((Date.now() - startTime) / 1000),
              errorRate: (failureCount / requestCount) * 100,
              peakMemoryUsage: Math.max(...metrics.map(m => m.memoryUsage)),
              averageCPUUsage: metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length
            },
            metrics,
            errors,
            recommendations: []
          }
        });
      }

      self.onmessage = function(e) {
        const { type, config, testId } = e.data;
        
        if (type === 'start_test') {
          testConfig = config;
          isRunning = true;
          metrics = [];
          errors = [];
          requestCount = 0;
          successCount = 0;
          failureCount = 0;
          
          self.postMessage({ type: 'test_started', testId });
          runTest().catch(error => {
            self.postMessage({ 
              type: 'test_error', 
              testId, 
              error: error.message 
            });
          });
        } else if (type === 'stop_test') {
          isRunning = false;
          self.postMessage({ type: 'test_stopped', testId });
        }
      };
    `;

    // Create worker pool (4 workers for parallel testing)
    for (let i = 0; i < 4; i++) {
      try {
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        
        worker.onmessage = (event) => {
          this.handleWorkerMessage(event);
        };
        
        if (!this.workers.has('pool')) {
          this.workers.set('pool', []);
        }
        this.workers.get('pool')!.push(worker);
      } catch (error) {
        console.warn('Failed to create performance test worker:', error);
      }
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { type, testId, results, error } = event.data;
    
    switch (type) {
      case 'test_started':
        this.updateTestStatus(testId, 'running');
        break;
      case 'test_completed':
        this.completeTest(testId, results);
        break;
      case 'test_error':
        this.failTest(testId, error);
        break;
      case 'test_stopped':
        this.updateTestStatus(testId, 'completed');
        break;
    }
  }

  public createLoadTest(config: Partial<TestConfig>): PerformanceTest {
    const testId = Math.random().toString(36).substr(2, 9);
    
    const test: PerformanceTest = {
      id: testId,
      name: `Load Test ${testId}`,
      type: 'load',
      config: {
        duration: 60000, // 1 minute
        concurrency: 10,
        rampUpTime: 10000, // 10 seconds
        scenarios: [{
          name: 'Basic Load',
          weight: 100,
          actions: [{
            type: 'api_call',
            url: config.targetUrl || '/',
            method: 'GET'
          }]
        }],
        thresholds: {
          maxResponseTime: 2000,
          maxErrorRate: 5,
          minThroughput: 10,
          maxMemoryUsage: 100,
          maxCPUUsage: 80
        },
        ...config
      },
      status: 'pending'
    };

    this.tests.set(testId, test);
    return test;
  }

  public createStressTest(config: Partial<TestConfig>): PerformanceTest {
    const testId = Math.random().toString(36).substr(2, 9);
    
    const test: PerformanceTest = {
      id: testId,
      name: `Stress Test ${testId}`,
      type: 'stress',
      config: {
        duration: 300000, // 5 minutes
        concurrency: 100,
        rampUpTime: 30000, // 30 seconds
        scenarios: [{
          name: 'High Load Stress',
          weight: 100,
          actions: [
            { type: 'api_call', url: config.targetUrl || '/', method: 'GET' },
            { type: 'wait', duration: 100 },
            { type: 'api_call', url: config.targetUrl || '/api/data', method: 'POST', payload: { test: true } }
          ]
        }],
        thresholds: {
          maxResponseTime: 5000,
          maxErrorRate: 10,
          minThroughput: 50,
          maxMemoryUsage: 200,
          maxCPUUsage: 90
        },
        ...config
      },
      status: 'pending'
    };

    this.tests.set(testId, test);
    return test;
  }

  public createEnduranceTest(config: Partial<TestConfig>): PerformanceTest {
    const testId = Math.random().toString(36).substr(2, 9);
    
    const test: PerformanceTest = {
      id: testId,
      name: `Endurance Test ${testId}`,
      type: 'endurance',
      config: {
        duration: 3600000, // 1 hour
        concurrency: 20,
        rampUpTime: 60000, // 1 minute
        scenarios: [{
          name: 'Sustained Load',
          weight: 100,
          actions: [
            { type: 'api_call', url: config.targetUrl || '/', method: 'GET' },
            { type: 'wait', duration: 5000 } // 5 second intervals
          ]
        }],
        thresholds: {
          maxResponseTime: 3000,
          maxErrorRate: 2,
          minThroughput: 5,
          maxMemoryUsage: 150,
          maxCPUUsage: 70
        },
        ...config
      },
      status: 'pending'
    };

    this.tests.set(testId, test);
    return test;
  }

  public async runTest(testId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (this.activeTests.has(testId)) {
      throw new Error(`Test ${testId} is already running`);
    }

    // Get available worker
    const worker = this.getAvailableWorker();
    if (!worker) {
      throw new Error('No available workers for running test');
    }

    this.activeTests.add(testId);
    test.status = 'running';
    test.startTime = Date.now();

    // Associate worker with test
    if (!this.workers.has(testId)) {
      this.workers.set(testId, []);
    }
    this.workers.get(testId)!.push(worker);

    // Start the test
    worker.postMessage({
      type: 'start_test',
      testId,
      config: test.config
    });

    this.notifyObservers(test);
  }

  public stopTest(testId: string): void {
    const test = this.tests.get(testId);
    if (!test || !this.activeTests.has(testId)) {
      return;
    }

    const workers = this.workers.get(testId);
    if (workers) {
      workers.forEach(worker => {
        worker.postMessage({ type: 'stop_test', testId });
      });
    }

    this.activeTests.delete(testId);
    test.status = 'completed';
    test.endTime = Date.now();

    this.notifyObservers(test);
  }

  private getAvailableWorker(): Worker | null {
    const pool = this.workers.get('pool');
    if (!pool || pool.length === 0) {
      return null;
    }

    // Simple round-robin selection
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private updateTestStatus(testId: string, status: PerformanceTest['status']): void {
    const test = this.tests.get(testId);
    if (test) {
      test.status = status;
      if (status === 'running') {
        test.startTime = Date.now();
      }
      this.notifyObservers(test);
    }
  }

  private completeTest(testId: string, results: TestResults): void {
    const test = this.tests.get(testId);
    if (test) {
      test.status = 'completed';
      test.endTime = Date.now();
      test.results = this.analyzeResults(results, test.config.thresholds);
      
      this.activeTests.delete(testId);
      this.returnWorkerToPool(testId);
      
      this.notifyObservers(test);
    }
  }

  private failTest(testId: string, error: string): void {
    const test = this.tests.get(testId);
    if (test) {
      test.status = 'failed';
      test.endTime = Date.now();
      
      this.activeTests.delete(testId);
      this.returnWorkerToPool(testId);
      
      this.notifyObservers(test);
    }
  }

  private returnWorkerToPool(testId: string): void {
    const workers = this.workers.get(testId);
    if (workers) {
      const pool = this.workers.get('pool') || [];
      pool.push(...workers);
      this.workers.set('pool', pool);
      this.workers.delete(testId);
    }
  }

  private analyzeResults(results: TestResults, thresholds: PerformanceThresholds): TestResults {
    const recommendations: string[] = [];

    // Analyze against thresholds
    if (results.summary.averageResponseTime > thresholds.maxResponseTime) {
      recommendations.push(`Average response time (${results.summary.averageResponseTime}ms) exceeds threshold (${thresholds.maxResponseTime}ms)`);
    }

    if (results.summary.errorRate > thresholds.maxErrorRate) {
      recommendations.push(`Error rate (${results.summary.errorRate}%) exceeds threshold (${thresholds.maxErrorRate}%)`);
    }

    if (results.summary.throughput < thresholds.minThroughput) {
      recommendations.push(`Throughput (${results.summary.throughput} RPS) is below threshold (${thresholds.minThroughput} RPS)`);
    }

    if (results.summary.peakMemoryUsage > thresholds.maxMemoryUsage) {
      recommendations.push(`Peak memory usage (${results.summary.peakMemoryUsage}MB) exceeds threshold (${thresholds.maxMemoryUsage}MB)`);
    }

    if (results.summary.averageCPUUsage > thresholds.maxCPUUsage) {
      recommendations.push(`Average CPU usage (${results.summary.averageCPUUsage}%) exceeds threshold (${thresholds.maxCPUUsage}%)`);
    }

    // Performance optimization recommendations
    if (results.summary.averageResponseTime > 1000) {
      recommendations.push('Consider implementing caching to reduce response times');
    }

    if (results.summary.errorRate > 1) {
      recommendations.push('Investigate and fix sources of errors to improve reliability');
    }

    if (results.summary.peakMemoryUsage > 100) {
      recommendations.push('Consider memory optimization techniques to reduce memory usage');
    }

    return {
      ...results,
      recommendations
    };
  }

  // Public API methods
  public getTest(testId: string): PerformanceTest | null {
    return this.tests.get(testId) || null;
  }

  public getAllTests(): PerformanceTest[] {
    return Array.from(this.tests.values());
  }

  public getActiveTests(): PerformanceTest[] {
    return Array.from(this.tests.values()).filter(test => this.activeTests.has(test.id));
  }

  public deleteTest(testId: string): boolean {
    if (this.activeTests.has(testId)) {
      this.stopTest(testId);
    }
    return this.tests.delete(testId);
  }

  public onTestUpdate(callback: (test: PerformanceTest) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(test: PerformanceTest): void {
    this.observers.forEach(observer => observer(test));
  }

  // Utility methods for creating common test scenarios
  public createWebsiteLoadTest(url: string, options: Partial<TestConfig> = {}): PerformanceTest {
    return this.createLoadTest({
      targetUrl: url,
      scenarios: [{
        name: 'Website Load Test',
        weight: 100,
        actions: [
          { type: 'navigate', target: url },
          { type: 'wait', duration: 2000 },
          { type: 'scroll', duration: 1000 },
          { type: 'click', target: 'a[href]' },
          { type: 'wait', duration: 1000 }
        ]
      }],
      ...options
    });
  }

  public createAPILoadTest(baseUrl: string, endpoints: string[], options: Partial<TestConfig> = {}): PerformanceTest {
    const actions: TestAction[] = endpoints.map(endpoint => ({
      type: 'api_call',
      url: `${baseUrl}${endpoint}`,
      method: 'GET'
    }));

    return this.createLoadTest({
      scenarios: [{
        name: 'API Load Test',
        weight: 100,
        actions
      }],
      ...options
    });
  }

  public destroy(): void {
    // Stop all active tests
    Array.from(this.activeTests).forEach(testId => this.stopTest(testId));

    // Terminate all workers
    this.workers.forEach(workers => {
      workers.forEach(worker => worker.terminate());
    });
    
    this.workers.clear();
    this.tests.clear();
    this.observers.clear();
  }
}