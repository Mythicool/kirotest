export interface ProxyConfig {
  corsProxyUrl?: string;
  apiKey?: string;
  rateLimitMs: number;
  cacheEnabled: boolean;
  cacheTtlMs: number;
}

export interface ApiEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface ProxyResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
  timestamp: number;
}

export class ServiceProxy {
  private config: ProxyConfig;
  private requestCache = new Map<string, { data: any; timestamp: number }>();
  private rateLimitMap = new Map<string, number>();
  private retryController = new AbortController();

  constructor(config: Partial<ProxyConfig> = {}) {
    this.config = {
      corsProxyUrl: 'https://api.allorigins.win/raw?url=',
      rateLimitMs: 1000,
      cacheEnabled: true,
      cacheTtlMs: 300000, // 5 minutes
      ...config
    };
  }

  async makeRequest<T = any>(
    endpoint: ApiEndpoint,
    data?: any,
    options: { useCache?: boolean; bypassCors?: boolean } = {}
  ): Promise<ProxyResponse<T>> {
    const cacheKey = this.generateCacheKey(endpoint, data);
    
    // Check cache first
    if (options.useCache !== false && this.config.cacheEnabled) {
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) return cached;
    }

    // Apply rate limiting
    await this.applyRateLimit(endpoint.url);

    try {
      const response = await this.executeRequest<T>(endpoint, data, options);
      
      // Cache successful responses
      if (this.config.cacheEnabled && response.status >= 200 && response.status < 300) {
        this.cacheResponse(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw this.handleRequestError(error, endpoint);
    }
  }

  async transformData(data: any, sourceToolId: string, targetToolId: string): Promise<any> {
    // Get transformation rules for tool pair
    const transformationRules = this.getTransformationRules(sourceToolId, targetToolId);
    
    if (!transformationRules) {
      return data; // No transformation needed
    }

    try {
      return await this.applyTransformation(data, transformationRules);
    } catch (error) {
      console.error(`Data transformation failed from ${sourceToolId} to ${targetToolId}:`, error);
      throw new Error(`Data transformation failed: ${error.message}`);
    }
  }

  getProxiedUrl(originalUrl: string, bypassCors: boolean = true): string {
    if (!bypassCors || this.isLocalUrl(originalUrl)) {
      return originalUrl;
    }

    // Use CORS proxy for external URLs
    return `${this.config.corsProxyUrl}${encodeURIComponent(originalUrl)}`;
  }

  async healthCheck(serviceUrl: string): Promise<boolean> {
    try {
      const response = await this.makeRequest({
        url: serviceUrl,
        method: 'GET',
        timeout: 5000
      }, null, { useCache: false });

      return response.status >= 200 && response.status < 400;
    } catch (error) {
      return false;
    }
  }

  clearCache(pattern?: string): void {
    if (!pattern) {
      this.requestCache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const [key] of this.requestCache) {
      if (regex.test(key)) {
        this.requestCache.delete(key);
      }
    }
  }

  private async executeRequest<T>(
    endpoint: ApiEndpoint,
    data?: any,
    options: { bypassCors?: boolean } = {}
  ): Promise<ProxyResponse<T>> {
    const url = options.bypassCors ? this.getProxiedUrl(endpoint.url) : endpoint.url;
    const timeout = endpoint.timeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...endpoint.headers
        },
        signal: controller.signal
      };

      if (data && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const responseData = await this.parseResponse<T>(response);

      return {
        data: responseData,
        status: response.status,
        headers: this.extractHeaders(response),
        cached: false,
        timestamp: Date.now()
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return await response.json();
    } else if (contentType.includes('text/')) {
      return await response.text() as unknown as T;
    } else if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
      return await response.blob() as unknown as T;
    } else {
      return await response.arrayBuffer() as unknown as T;
    }
  }

  private extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  private generateCacheKey(endpoint: ApiEndpoint, data?: any): string {
    const keyData = {
      url: endpoint.url,
      method: endpoint.method,
      data: data || null
    };
    return btoa(JSON.stringify(keyData));
  }

  private getCachedResponse<T>(cacheKey: string): ProxyResponse<T> | null {
    const cached = this.requestCache.get(cacheKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.config.cacheTtlMs;
    if (isExpired) {
      this.requestCache.delete(cacheKey);
      return null;
    }

    return {
      ...cached.data,
      cached: true
    };
  }

  private cacheResponse<T>(cacheKey: string, response: ProxyResponse<T>): void {
    this.requestCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
  }

  private async applyRateLimit(url: string): Promise<void> {
    const domain = new URL(url).hostname;
    const lastRequest = this.rateLimitMap.get(domain) || 0;
    const timeSinceLastRequest = Date.now() - lastRequest;

    if (timeSinceLastRequest < this.config.rateLimitMs) {
      const waitTime = this.config.rateLimitMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.rateLimitMap.set(domain, Date.now());
  }

  private isLocalUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'localhost' || 
             urlObj.hostname === '127.0.0.1' || 
             urlObj.hostname.endsWith('.local');
    } catch {
      return false;
    }
  }

  private getTransformationRules(sourceToolId: string, targetToolId: string): any {
    // Define transformation rules between different tools
    const transformationMap: Record<string, Record<string, any>> = {
      'photopea': {
        'svg-edit': {
          type: 'image-to-svg',
          converter: 'raster-to-vector'
        },
        'tinypng': {
          type: 'image-optimization',
          format: 'png'
        }
      },
      'svg-edit': {
        'photopea': {
          type: 'svg-to-raster',
          format: 'png',
          resolution: 300
        }
      },
      'markdown-editor': {
        'pandoc': {
          type: 'document-conversion',
          inputFormat: 'markdown',
          outputFormat: 'html'
        }
      }
    };

    return transformationMap[sourceToolId]?.[targetToolId] || null;
  }

  private async applyTransformation(data: any, rules: any): Promise<any> {
    switch (rules.type) {
      case 'image-to-svg':
        return this.convertImageToSvg(data, rules);
      case 'svg-to-raster':
        return this.convertSvgToRaster(data, rules);
      case 'image-optimization':
        return this.optimizeImage(data, rules);
      case 'document-conversion':
        return this.convertDocument(data, rules);
      default:
        return data;
    }
  }

  private async convertImageToSvg(imageData: any, rules: any): Promise<any> {
    // Placeholder for image to SVG conversion
    // In a real implementation, this would use a service like Vectorizer.io
    console.log('Converting image to SVG with rules:', rules);
    return {
      type: 'svg',
      data: imageData,
      converted: true
    };
  }

  private async convertSvgToRaster(svgData: any, rules: any): Promise<any> {
    // Convert SVG to raster format
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          resolve({
            type: rules.format || 'png',
            data: blob,
            width: canvas.width,
            height: canvas.height
          });
        }, `image/${rules.format || 'png'}`);
      };

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(svgBlob);
    });
  }

  private async optimizeImage(imageData: any, rules: any): Promise<any> {
    // Placeholder for image optimization
    // In a real implementation, this would use TinyPNG API
    console.log('Optimizing image with rules:', rules);
    return {
      ...imageData,
      optimized: true,
      compressionRatio: 0.7
    };
  }

  private async convertDocument(documentData: any, rules: any): Promise<any> {
    // Placeholder for document conversion
    // In a real implementation, this would use Pandoc API
    console.log('Converting document with rules:', rules);
    return {
      inputFormat: rules.inputFormat,
      outputFormat: rules.outputFormat,
      data: documentData,
      converted: true
    };
  }

  private handleRequestError(error: any, endpoint: ApiEndpoint): Error {
    if (error.name === 'AbortError') {
      return new Error(`Request timeout for ${endpoint.url}`);
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new Error(`Network error accessing ${endpoint.url}: ${error.message}`);
    }

    return new Error(`Request failed for ${endpoint.url}: ${error.message}`);
  }
}