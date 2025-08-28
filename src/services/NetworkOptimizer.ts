export interface RequestBatch {
  id: string;
  requests: NetworkRequest[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  maxConcurrency: number;
  timeout: number;
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  retries: number;
  timeout: number;
  compression?: boolean;
}

export interface NetworkResponse {
  id: string;
  status: number;
  data: any;
  headers: Record<string, string>;
  duration: number;
  fromCache: boolean;
  compressed: boolean;
}

export interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalBytesTransferred: number;
  compressionRatio: number;
  cacheHitRate: number;
}

export class NetworkOptimizer {
  private requestQueue = new Map<string, RequestBatch>();
  private activeRequests = new Map<string, AbortController>();
  private stats: NetworkStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    totalBytesTransferred: 0,
    compressionRatio: 0,
    cacheHitRate: 0
  };
  private responseCache = new Map<string, { response: NetworkResponse; timestamp: number }>();
  private compressionWorker: Worker | null = null;

  constructor() {
    this.initializeCompressionWorker();
    this.startBatchProcessor();
  }

  private initializeCompressionWorker(): void {
    try {
      // Create compression worker for request/response compression
      const workerCode = `
        self.onmessage = function(e) {
          const { type, data, id } = e.data;
          
          if (type === 'compress') {
            try {
              const compressed = new TextEncoder().encode(JSON.stringify(data));
              self.postMessage({ id, type: 'compressed', data: compressed });
            } catch (error) {
              self.postMessage({ id, type: 'error', error: error.message });
            }
          } else if (type === 'decompress') {
            try {
              const decompressed = JSON.parse(new TextDecoder().decode(data));
              self.postMessage({ id, type: 'decompressed', data: decompressed });
            } catch (error) {
              self.postMessage({ id, type: 'error', error: error.message });
            }
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
    } catch (error) {
      console.warn('Failed to initialize compression worker:', error);
    }
  }

  private startBatchProcessor(): void {
    // Process batches every 100ms
    setInterval(() => {
      this.processBatches();
    }, 100);
  }

  public addRequest(request: NetworkRequest): Promise<NetworkResponse> {
    return new Promise((resolve, reject) => {
      const batchId = this.getBatchId(request);
      let batch = this.requestQueue.get(batchId);

      if (!batch) {
        batch = {
          id: batchId,
          requests: [],
          priority: request.priority,
          maxConcurrency: this.getMaxConcurrency(request.priority),
          timeout: request.timeout
        };
        this.requestQueue.set(batchId, batch);
      }

      // Add resolve/reject handlers to the request
      (request as any).resolve = resolve;
      (request as any).reject = reject;
      
      batch.requests.push(request);
    });
  }

  private getBatchId(request: NetworkRequest): string {
    // Group requests by domain and priority for batching
    const url = new URL(request.url);
    return `${url.hostname}-${request.priority}`;
  }

  private getMaxConcurrency(priority: NetworkRequest['priority']): number {
    switch (priority) {
      case 'critical': return 6;
      case 'high': return 4;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private async processBatches(): Promise<void> {
    const batches = Array.from(this.requestQueue.values())
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));

    for (const batch of batches) {
      if (batch.requests.length > 0) {
        await this.processBatch(batch);
      }
    }
  }

  private getPriorityWeight(priority: NetworkRequest['priority']): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private async processBatch(batch: RequestBatch): Promise<void> {
    const requests = batch.requests.splice(0, batch.maxConcurrency);
    if (requests.length === 0) return;

    // Process requests concurrently within the batch
    const promises = requests.map(request => this.executeRequest(request));
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn('Batch processing error:', error);
    }

    // Clean up empty batches
    if (batch.requests.length === 0) {
      this.requestQueue.delete(batch.id);
    }
  }

  private async executeRequest(request: NetworkRequest): Promise<void> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey(request);
    
    try {
      // Check cache first
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        this.stats.cacheHitRate = this.updateCacheHitRate(true);
        (request as any).resolve(cachedResponse);
        return;
      }

      this.stats.cacheHitRate = this.updateCacheHitRate(false);

      // Create abort controller for request cancellation
      const abortController = new AbortController();
      this.activeRequests.set(request.id, abortController);

      // Prepare request options
      const requestOptions: RequestInit = {
        method: request.method,
        headers: await this.prepareHeaders(request),
        body: await this.prepareBody(request),
        signal: abortController.signal,
        // Add compression support
        ...(request.compression && { 
          headers: { 
            ...request.headers, 
            'Accept-Encoding': 'gzip, deflate, br' 
          } 
        })
      };

      // Execute the request with timeout
      const response = await Promise.race([
        fetch(request.url, requestOptions),
        this.createTimeoutPromise(request.timeout)
      ]);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Process response
      const networkResponse = await this.processResponse(request, response, duration);
      
      // Cache successful responses
      if (networkResponse.status >= 200 && networkResponse.status < 300) {
        this.cacheResponse(cacheKey, networkResponse);
      }

      // Update statistics
      this.updateStats(networkResponse, duration);

      (request as any).resolve(networkResponse);
    } catch (error) {
      this.stats.failedRequests++;
      (request as any).reject(error);
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  private getCacheKey(request: NetworkRequest): string {
    // Create cache key based on URL and method
    return `${request.method}:${request.url}`;
  }

  private getCachedResponse(cacheKey: string): NetworkResponse | null {
    const cached = this.responseCache.get(cacheKey);
    if (!cached) return null;

    // Check if cache entry is still valid (5 minutes)
    const maxAge = 5 * 60 * 1000;
    if (Date.now() - cached.timestamp > maxAge) {
      this.responseCache.delete(cacheKey);
      return null;
    }

    return { ...cached.response, fromCache: true };
  }

  private cacheResponse(cacheKey: string, response: NetworkResponse): void {
    // Only cache GET requests
    if (cacheKey.startsWith('GET:')) {
      this.responseCache.set(cacheKey, {
        response: { ...response, fromCache: false },
        timestamp: Date.now()
      });

      // Limit cache size
      if (this.responseCache.size > 100) {
        const oldestKey = this.responseCache.keys().next().value;
        this.responseCache.delete(oldestKey);
      }
    }
  }

  private async prepareHeaders(request: NetworkRequest): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...request.headers
    };

    // Add compression headers if supported
    if (request.compression) {
      headers['Accept-Encoding'] = 'gzip, deflate, br';
    }

    return headers;
  }

  private async prepareBody(request: NetworkRequest): Promise<string | FormData | null> {
    if (!request.body) return null;

    if (request.body instanceof FormData) {
      return request.body;
    }

    // Compress body if compression is enabled and worker is available
    if (request.compression && this.compressionWorker) {
      try {
        const compressed = await this.compressData(request.body);
        return compressed;
      } catch (error) {
        console.warn('Compression failed, sending uncompressed:', error);
      }
    }

    return JSON.stringify(request.body);
  }

  private async compressData(data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        reject(new Error('Compression worker not available'));
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);
      
      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handler);
          
          if (event.data.type === 'compressed') {
            resolve(event.data.data);
          } else if (event.data.type === 'error') {
            reject(new Error(event.data.error));
          }
        }
      };

      this.compressionWorker.addEventListener('message', handler);
      this.compressionWorker.postMessage({ type: 'compress', data, id });
    });
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  private async processResponse(
    request: NetworkRequest, 
    response: Response, 
    duration: number
  ): Promise<NetworkResponse> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let data: any;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.arrayBuffer();
    }

    // Check if response was compressed
    const compressed = response.headers.get('content-encoding') !== null;

    return {
      id: request.id,
      status: response.status,
      data,
      headers,
      duration,
      fromCache: false,
      compressed
    };
  }

  private updateStats(response: NetworkResponse, duration: number): void {
    this.stats.totalRequests++;
    
    if (response.status >= 200 && response.status < 300) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Update average response time
    const totalTime = this.stats.averageResponseTime * (this.stats.totalRequests - 1) + duration;
    this.stats.averageResponseTime = totalTime / this.stats.totalRequests;

    // Estimate bytes transferred
    const estimatedBytes = JSON.stringify(response.data).length;
    this.stats.totalBytesTransferred += estimatedBytes;

    // Update compression ratio
    if (response.compressed) {
      this.stats.compressionRatio = this.calculateCompressionRatio();
    }
  }

  private updateCacheHitRate(isHit: boolean): number {
    const totalCacheChecks = this.stats.totalRequests;
    const currentHits = this.stats.cacheHitRate * (totalCacheChecks - 1) / 100;
    const newHits = currentHits + (isHit ? 1 : 0);
    
    return (newHits / totalCacheChecks) * 100;
  }

  private calculateCompressionRatio(): number {
    // Simplified compression ratio calculation
    // In a real implementation, you'd track original vs compressed sizes
    return 0.3; // Assume 30% compression ratio
  }

  // Public API methods
  public async get(url: string, options: Partial<NetworkRequest> = {}): Promise<NetworkResponse> {
    const request: NetworkRequest = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      method: 'GET',
      priority: 'medium',
      retries: 3,
      timeout: 10000,
      compression: true,
      ...options
    };

    return this.addRequest(request);
  }

  public async post(url: string, data: any, options: Partial<NetworkRequest> = {}): Promise<NetworkResponse> {
    const request: NetworkRequest = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      method: 'POST',
      body: data,
      priority: 'medium',
      retries: 3,
      timeout: 15000,
      compression: true,
      ...options
    };

    return this.addRequest(request);
  }

  public cancelRequest(requestId: string): boolean {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      return true;
    }
    return false;
  }

  public cancelAllRequests(): void {
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
    this.requestQueue.clear();
  }

  public getStats(): NetworkStats {
    return { ...this.stats };
  }

  public clearCache(): void {
    this.responseCache.clear();
  }

  public getQueueSize(): number {
    let totalRequests = 0;
    this.requestQueue.forEach(batch => {
      totalRequests += batch.requests.length;
    });
    return totalRequests;
  }

  public getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  public destroy(): void {
    this.cancelAllRequests();
    this.clearCache();
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = null;
    }
  }
}