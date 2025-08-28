export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  tags?: string[];
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTTL: number; // Default time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  strategy: 'lru' | 'lfu' | 'fifo'; // Eviction strategy
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  entryCount: number;
  memoryUsage: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    entryCount: 0,
    memoryUsage: 0
  };
  private cleanupInterval: number | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 1000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      strategy: 'lru',
      ...config
    };

    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  public set<T>(key: string, value: T, ttl?: number, tags?: string[]): void {
    const now = Date.now();
    const entryTTL = ttl || this.config.defaultTTL;
    const size = this.calculateSize(value);

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Check if we need to make space
    this.ensureSpace(size);

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      ttl: entryTTL,
      size,
      accessCount: 0,
      lastAccessed: now,
      tags
    };

    this.cache.set(key, entry);
    this.updateStats();
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    this.updateHitRate();
    
    return entry.value;
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  public delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.size -= entry.size;
    this.stats.entryCount--;
    this.updateMemoryUsage();
    
    return true;
  }

  public clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.entryCount = 0;
    this.stats.memoryUsage = 0;
  }

  public getByTag(tag: string): Array<{ key: string; value: any }> {
    const results: Array<{ key: string; value: any }> = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.tags && entry.tags.includes(tag) && !this.isExpired(entry)) {
        results.push({ key, value: entry.value });
      }
    });
    
    return results;
  }

  public deleteByTag(tag: string): number {
    let deletedCount = 0;
    
    this.cache.forEach((entry, key) => {
      if (entry.tags && entry.tags.includes(tag)) {
        this.delete(key);
        deletedCount++;
      }
    });
    
    return deletedCount;
  }

  public touch(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) return false;
    
    entry.lastAccessed = Date.now();
    return true;
  }

  public extend(key: string, additionalTTL: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    entry.ttl += additionalTTL;
    return true;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl);
  }

  private calculateSize(value: any): number {
    // Rough estimation of object size in bytes
    const json = JSON.stringify(value);
    return new Blob([json]).size;
  }

  private ensureSpace(requiredSize: number): void {
    // Check if we need to free up space
    while (
      (this.stats.size + requiredSize > this.config.maxSize) ||
      (this.stats.entryCount >= this.config.maxEntries)
    ) {
      const keyToEvict = this.selectEvictionCandidate();
      if (!keyToEvict) break; // No more entries to evict
      
      this.delete(keyToEvict);
    }
  }

  private selectEvictionCandidate(): string | null {
    if (this.cache.size === 0) return null;

    const entries = Array.from(this.cache.entries());
    
    switch (this.config.strategy) {
      case 'lru':
        return this.selectLRU(entries);
      case 'lfu':
        return this.selectLFU(entries);
      case 'fifo':
        return this.selectFIFO(entries);
      default:
        return entries[0][0]; // Fallback to first entry
    }
  }

  private selectLRU(entries: Array<[string, CacheEntry]>): string {
    // Least Recently Used
    let oldestKey = entries[0][0];
    let oldestTime = entries[0][1].lastAccessed;
    
    for (const [key, entry] of entries) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  private selectLFU(entries: Array<[string, CacheEntry]>): string {
    // Least Frequently Used
    let leastUsedKey = entries[0][0];
    let leastUsedCount = entries[0][1].accessCount;
    
    for (const [key, entry] of entries) {
      if (entry.accessCount < leastUsedCount) {
        leastUsedCount = entry.accessCount;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }

  private selectFIFO(entries: Array<[string, CacheEntry]>): string {
    // First In, First Out
    let oldestKey = entries[0][0];
    let oldestTime = entries[0][1].timestamp;
    
    for (const [key, entry] of entries) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    // Find expired entries
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    });
    
    // Remove expired entries
    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  private updateStats(): void {
    this.stats.entryCount = this.cache.size;
    this.updateMemoryUsage();
  }

  private updateMemoryUsage(): void {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += entry.size;
    });
    this.stats.size = totalSize;
    this.stats.memoryUsage = totalSize;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  // Public API methods
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public getConfig(): CacheConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval && this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.startCleanupTimer();
    }
  }

  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  public values(): any[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  public entries(): Array<[string, any]> {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }

  public size(): number {
    return this.cache.size;
  }

  public memoryUsage(): number {
    return this.stats.memoryUsage;
  }

  // Advanced caching patterns
  public memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl?: number
  ): T {
    const cache = this;
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cacheKey = `memoized:${fn.name}:${key}`;
      
      let result = cache.get(cacheKey);
      if (result === null) {
        result = fn(...args);
        cache.set(cacheKey, result, ttl);
      }
      
      return result;
    }) as T;
  }

  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number,
    tags?: string[]
  ): Promise<T> {
    let value = this.get<T>(key);
    
    if (value === null) {
      value = await factory();
      this.set(key, value, ttl, tags);
    }
    
    return value;
  }

  public batch(operations: Array<{
    operation: 'set' | 'get' | 'delete';
    key: string;
    value?: any;
    ttl?: number;
    tags?: string[];
  }>): Array<any> {
    const results: Array<any> = [];
    
    operations.forEach(op => {
      switch (op.operation) {
        case 'set':
          this.set(op.key, op.value, op.ttl, op.tags);
          results.push(true);
          break;
        case 'get':
          results.push(this.get(op.key));
          break;
        case 'delete':
          results.push(this.delete(op.key));
          break;
      }
    });
    
    return results;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clear();
  }
}