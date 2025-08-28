import { ToolInstance } from './IntegrationManager';

export interface HealthCheckResult {
  instanceId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  errorCount: number;
  consecutiveFailures: number;
}

export interface FallbackOption {
  toolId: string;
  priority: number;
  capabilities: string[];
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export interface MonitorConfig {
  healthCheckInterval: number;
  timeoutMs: number;
  maxConsecutiveFailures: number;
  degradedThresholdMs: number;
  unhealthyThresholdMs: number;
}

export class ToolHealthMonitor {
  private instances = new Map<string, ToolInstance>();
  private healthResults = new Map<string, HealthCheckResult>();
  private fallbackMap = new Map<string, FallbackOption[]>();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private config: MonitorConfig;
  private listeners = new Map<string, Function[]>();

  constructor(config: Partial<MonitorConfig> = {}) {
    this.config = {
      healthCheckInterval: 60000, // 1 minute
      timeoutMs: 5000,
      maxConsecutiveFailures: 3,
      degradedThresholdMs: 2000,
      unhealthyThresholdMs: 5000,
      ...config
    };

    this.initializeFallbackMap();
    this.startMonitoring();
  }

  addInstance(instance: ToolInstance): void {
    this.instances.set(instance.id, instance);
    this.healthResults.set(instance.id, {
      instanceId: instance.id,
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date(),
      errorCount: 0,
      consecutiveFailures: 0
    });
  }

  removeInstance(instanceId: string): void {
    this.instances.delete(instanceId);
    this.healthResults.delete(instanceId);
  }

  async performHealthCheck(instanceId: string): Promise<HealthCheckResult> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      // Perform ping to check if tool is responsive
      await this.pingInstance(instance);
      
      const responseTime = Date.now() - startTime;
      const status = this.determineHealthStatus(responseTime);

      result = {
        instanceId,
        status,
        responseTime,
        lastCheck: new Date(),
        errorCount: this.healthResults.get(instanceId)?.errorCount || 0,
        consecutiveFailures: status === 'healthy' ? 0 : 
          (this.healthResults.get(instanceId)?.consecutiveFailures || 0) + 1
      };

    } catch (error) {
      const previousResult = this.healthResults.get(instanceId);
      result = {
        instanceId,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorCount: (previousResult?.errorCount || 0) + 1,
        consecutiveFailures: (previousResult?.consecutiveFailures || 0) + 1
      };

      console.error(`Health check failed for instance ${instanceId}:`, error);
    }

    this.healthResults.set(instanceId, result);

    // Trigger fallback if needed
    if (result.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      this.emit('healthCheckFailed', instanceId);
      await this.triggerFallback(instanceId);
    }

    return result;
  }

  async performBatchHealthCheck(): Promise<HealthCheckResult[]> {
    const promises = Array.from(this.instances.keys()).map(instanceId =>
      this.performHealthCheck(instanceId).catch(error => {
        console.error(`Batch health check failed for ${instanceId}:`, error);
        return null;
      })
    );

    const results = await Promise.all(promises);
    return results.filter(result => result !== null) as HealthCheckResult[];
  }

  getHealthStatus(instanceId: string): HealthCheckResult | null {
    return this.healthResults.get(instanceId) || null;
  }

  getAllHealthStatuses(): HealthCheckResult[] {
    return Array.from(this.healthResults.values());
  }

  async getFallbackOptions(toolId: string): Promise<FallbackOption[]> {
    const fallbacks = this.fallbackMap.get(toolId) || [];
    
    // Update health status for each fallback option
    const updatedFallbacks = await Promise.all(
      fallbacks.map(async (fallback) => {
        const healthStatus = await this.checkFallbackHealth(fallback.toolId);
        return { ...fallback, healthStatus };
      })
    );

    // Sort by priority and health status
    return updatedFallbacks.sort((a, b) => {
      if (a.healthStatus === 'healthy' && b.healthStatus !== 'healthy') return -1;
      if (b.healthStatus === 'healthy' && a.healthStatus !== 'healthy') return 1;
      return a.priority - b.priority;
    });
  }

  registerFallback(toolId: string, fallbackOptions: Omit<FallbackOption, 'healthStatus'>[]): void {
    const fallbacks = fallbackOptions.map(option => ({
      ...option,
      healthStatus: 'healthy' as const
    }));
    
    this.fallbackMap.set(toolId, fallbacks);
  }

  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performBatchHealthCheck();
      } catch (error) {
        console.error('Batch health check failed:', error);
      }
    }, this.config.healthCheckInterval);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async pingInstance(instance: ToolInstance): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Health check timeout'));
      }, this.config.timeoutMs);

      // Send ping message to iframe
      const messageId = `health_check_${Date.now()}`;
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'health_check_response' && 
            event.data?.messageId === messageId) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          resolve();
        }
      };

      window.addEventListener('message', handleMessage);

      try {
        instance.iframe.contentWindow?.postMessage({
          type: 'health_check',
          messageId
        }, '*');
      } catch (error) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
        reject(error);
      }
    });
  }

  private determineHealthStatus(responseTime: number): 'healthy' | 'degraded' | 'unhealthy' {
    if (responseTime > this.config.unhealthyThresholdMs) {
      return 'unhealthy';
    } else if (responseTime > this.config.degradedThresholdMs) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  private async triggerFallback(failedInstanceId: string): Promise<void> {
    const instance = this.instances.get(failedInstanceId);
    if (!instance) return;

    const fallbackOptions = await this.getFallbackOptions(instance.toolId);
    const healthyFallback = fallbackOptions.find(f => f.healthStatus === 'healthy');

    if (healthyFallback) {
      this.emit('fallbackTriggered', {
        failedInstanceId,
        fallbackToolId: healthyFallback.toolId,
        reason: 'health_check_failure'
      });
    } else {
      this.emit('noFallbackAvailable', {
        failedInstanceId,
        toolId: instance.toolId
      });
    }
  }

  private async checkFallbackHealth(toolId: string): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    // Find instances of this tool type
    const toolInstances = Array.from(this.instances.values())
      .filter(instance => instance.toolId === toolId);

    if (toolInstances.length === 0) {
      // No instances running, assume healthy for potential fallback
      return 'healthy';
    }

    // Check the health of existing instances
    const healthStatuses = toolInstances.map(instance => 
      this.healthResults.get(instance.id)?.status || 'healthy'
    );

    if (healthStatuses.every(status => status === 'healthy')) {
      return 'healthy';
    } else if (healthStatuses.some(status => status === 'healthy')) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  private initializeFallbackMap(): void {
    // Define fallback relationships between tools
    this.registerFallback('photopea', [
      { toolId: 'pixlr-editor', priority: 1, capabilities: ['image-editing', 'layers'] },
      { toolId: 'photopea-alternative', priority: 2, capabilities: ['image-editing'] }
    ]);

    this.registerFallback('svg-edit', [
      { toolId: 'method-draw', priority: 1, capabilities: ['vector-editing', 'svg'] },
      { toolId: 'boxy-svg', priority: 2, capabilities: ['vector-editing'] }
    ]);

    this.registerFallback('replit', [
      { toolId: 'codepen', priority: 1, capabilities: ['code-execution', 'web-preview'] },
      { toolId: 'jsbin', priority: 2, capabilities: ['code-execution'] }
    ]);

    this.registerFallback('hackmd', [
      { toolId: 'dillinger', priority: 1, capabilities: ['markdown-editing', 'collaboration'] },
      { toolId: 'stackedit', priority: 2, capabilities: ['markdown-editing'] }
    ]);

    this.registerFallback('tinypng', [
      { toolId: 'compressor-io', priority: 1, capabilities: ['image-compression'] },
      { toolId: 'imageoptim', priority: 2, capabilities: ['image-optimization'] }
    ]);
  }

  // Event emitter functionality
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => listener(data));
  }

  // Cleanup
  destroy(): void {
    this.stopMonitoring();
    this.instances.clear();
    this.healthResults.clear();
    this.listeners.clear();
  }
}