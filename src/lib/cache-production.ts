/**
 * Production-grade in-memory caching system with TTL support
 * Provides high-performance caching with automatic cleanup and monitoring
 */

// Use performance API that works in both Node.js and browser environments
const getPerformanceNow = (): number => {
  if (typeof performance !== 'undefined') {
    return performance.now();
  }
  // Fallback for environments without performance API
  return Date.now();
};

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Approximate size in bytes
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number; // Approximate total size in bytes
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  averageAccessTime: number;
  oldestEntry: number;
  newestEntry: number;
  expiredEntries: number;
}

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  maxSize: number; // Maximum number of entries
  maxMemory: number; // Maximum memory usage in bytes
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableMetrics: boolean; // Enable performance metrics
}

/**
 * Production cache class with TTL and LRU eviction
 */
export class ProductionCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = {
    hits: 0,
    misses: 0,
    totalAccessTime: 0,
    accessCount: 0,
  };
  private cleanupTimer: NodeJS.Timeout | null = null;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      maxMemory: config.maxMemory || 100 * 1024 * 1024, // 100MB default
      defaultTTL: config.defaultTTL || 300000, // 5 minutes default
      cleanupInterval: config.cleanupInterval || 60000, // 1 minute cleanup
      enableMetrics: config.enableMetrics !== false,
    };

    // Start automatic cleanup
    this.startCleanup();
  }

  /**
   * Set cache entry with TTL
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.config.defaultTTL;
    const size = this.estimateSize(data);

    // Check if we need to evict entries
    this.evictIfNeeded(size);

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 0,
      lastAccessed: now,
      size,
    };

    this.cache.set(key, entry);
  }

  /**
   * Get cache entry with performance tracking
   */
  get(key: string): T | null {
    const startTime = this.config.enableMetrics ? getPerformanceNow() : 0;
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    // Track performance metrics
    if (this.config.enableMetrics) {
      const accessTime = getPerformanceNow() - startTime;
      this.stats.totalAccessTime += accessTime;
      this.stats.accessCount++;
    }

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalRequests = this.stats.hits + this.stats.misses;
    const expiredEntries = entries.filter(
      entry => now - entry.timestamp > entry.ttl
    ).length;

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      averageAccessTime: this.stats.accessCount > 0 
        ? this.stats.totalAccessTime / this.stats.accessCount 
        : 0,
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(e => e.timestamp)) 
        : 0,
      newestEntry: entries.length > 0 
        ? Math.max(...entries.map(e => e.timestamp)) 
        : 0,
      expiredEntries,
    };
  }

  /**
   * Get cache entry with metadata
   */
  getWithMetadata(key: string): { data: T; metadata: Omit<CacheEntry<T>, 'data'> } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = now;

    return {
      data: entry.data,
      metadata: {
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
        size: entry.size,
      },
    };
  }

  /**
   * Update TTL for existing entry
   */
  updateTTL(key: string, newTTL: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = newTTL;
    entry.timestamp = Date.now(); // Reset timestamp
    return true;
  }

  /**
   * Get all keys (non-expired)
   */
  keys(): string[] {
    const now = Date.now();
    const validKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp <= entry.ttl) {
        validKeys.push(key);
      }
    }

    return validKeys;
  }

  /**
   * Get cache size information
   */
  size(): { entries: number; bytes: number } {
    const entries = Array.from(this.cache.values());
    return {
      entries: this.cache.size,
      bytes: entries.reduce((sum, entry) => sum + entry.size, 0),
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Evict entries if cache is full
   */
  private evictIfNeeded(newEntrySize: number): void {
    // Check entry count limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    // Check memory limit
    const currentSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    if (currentSize + newEntrySize > this.config.maxMemory) {
      this.evictBySize(newEntrySize);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Evict entries to free up memory
   */
  private evictBySize(requiredSize: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedSize = 0;
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      freedSize += entry.size;
      
      if (freedSize >= requiredSize) {
        break;
      }
    }
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: T): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default size if serialization fails
    }
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalAccessTime: 0,
      accessCount: 0,
    };
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
  }
}

/**
 * Global cache instances for different use cases
 */
export const dashboardCache = new ProductionCache({
  maxSize: 500,
  maxMemory: 50 * 1024 * 1024, // 50MB
  defaultTTL: 300000, // 5 minutes
  cleanupInterval: 60000, // 1 minute
});

export const publisherCache = new ProductionCache({
  maxSize: 1000,
  maxMemory: 100 * 1024 * 1024, // 100MB
  defaultTTL: 600000, // 10 minutes
  cleanupInterval: 120000, // 2 minutes
});

export const analyticsCache = new ProductionCache({
  maxSize: 200,
  maxMemory: 20 * 1024 * 1024, // 20MB
  defaultTTL: 900000, // 15 minutes
  cleanupInterval: 300000, // 5 minutes
});

export const sessionCache = new ProductionCache({
  maxSize: 2000,
  maxMemory: 10 * 1024 * 1024, // 10MB
  defaultTTL: 1800000, // 30 minutes
  cleanupInterval: 300000, // 5 minutes
});

/**
 * Cache invalidation strategies
 */
export class CacheInvalidator {
  private caches: Map<string, ProductionCache> = new Map();

  constructor() {
    this.caches.set('dashboard', dashboardCache);
    this.caches.set('publisher', publisherCache);
    this.caches.set('analytics', analyticsCache);
    this.caches.set('session', sessionCache);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: string, cacheNames?: string[]): number {
    const regex = new RegExp(pattern);
    let totalInvalidated = 0;

    const cachesToCheck = cacheNames 
      ? cacheNames.map(name => this.caches.get(name)).filter(Boolean)
      : Array.from(this.caches.values());

    for (const cache of cachesToCheck) {
      if (!cache) continue;

      const keys = cache.keys();
      for (const key of keys) {
        if (regex.test(key)) {
          cache.delete(key);
          totalInvalidated++;
        }
      }
    }

    return totalInvalidated;
  }

  /**
   * Invalidate user-specific cache entries
   */
  invalidateUserCache(userId: string): number {
    return this.invalidateByPattern(`user:${userId}:`);
  }

  /**
   * Invalidate publisher-related cache entries
   */
  invalidatePublisherCache(publisherId?: string): number {
    const pattern = publisherId ? `publisher:${publisherId}:` : 'publisher:';
    return this.invalidateByPattern(pattern, ['publisher', 'dashboard']);
  }

  /**
   * Invalidate province-related cache entries
   */
  invalidateProvinceCache(provinceId?: string): number {
    const pattern = provinceId ? `province:${provinceId}:` : 'province:';
    return this.invalidateByPattern(pattern, ['publisher', 'dashboard']);
  }

  /**
   * Get cache statistics for all caches
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }

    return stats;
  }

  /**
   * Cleanup all caches
   */
  cleanupAll(): Record<string, number> {
    const results: Record<string, number> = {};
    
    for (const [name, cache] of this.caches.entries()) {
      results[name] = cache.cleanup();
    }

    return results;
  }
}

/**
 * Global cache invalidator instance
 */
export const cacheInvalidator = new CacheInvalidator();

/**
 * Utility functions for cache key generation
 */
export const CacheKeys = {
  dashboard: (userId: string) => `dashboard:user:${userId}`,
  publishers: (page: number, limit: number, search?: string, provinceId?: string) => 
    `publishers:page:${page}:limit:${limit}:search:${search || 'none'}:province:${provinceId || 'all'}`,
  provinces: (page: number, limit: number, search?: string) => 
    `provinces:page:${page}:limit:${limit}:search:${search || 'none'}`,
  userBookmarks: (userId: string, page: number, limit: number) => 
    `bookmarks:user:${userId}:page:${page}:limit:${limit}`,
  userAnalytics: (userId: string, startDate: string, endDate: string) => 
    `analytics:user:${userId}:start:${startDate}:end:${endDate}`,
  publisherDetails: (publisherId: string) => `publisher:${publisherId}:details`,
  provinceDetails: (provinceId: string) => `province:${provinceId}:details`,
  userSession: (sessionId: string) => `session:${sessionId}`,
};

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  /**
   * Warm dashboard cache for active users
   */
  static async warmDashboardCache(userIds: string[]): Promise<void> {
    // This would be implemented with actual data loading
    // For now, it's a placeholder for the warming strategy
    console.log(`Warming dashboard cache for ${userIds.length} users`);
  }

  /**
   * Warm publisher cache with popular queries
   */
  static async warmPublisherCache(): Promise<void> {
    // This would pre-load popular publisher queries
    console.log('Warming publisher cache with popular queries');
  }

  /**
   * Warm province cache
   */
  static async warmProvinceCache(): Promise<void> {
    // This would pre-load province data
    console.log('Warming province cache');
  }
}

/**
 * Cache monitoring and health check
 */
export function getCacheHealth(): {
  status: 'healthy' | 'warning' | 'critical';
  details: Record<string, any>;
} {
  const allStats = cacheInvalidator.getAllStats();
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  const details: Record<string, any> = {};

  for (const [name, stats] of Object.entries(allStats)) {
    details[name] = {
      hitRate: stats.hitRate,
      totalEntries: stats.totalEntries,
      totalSize: stats.totalSize,
      expiredEntries: stats.expiredEntries,
    };

    // Check for warning conditions
    if (stats.hitRate < 0.5 && stats.totalHits + stats.totalMisses > 100) {
      status = 'warning';
    }

    // Check for critical conditions
    if (stats.hitRate < 0.2 && stats.totalHits + stats.totalMisses > 1000) {
      status = 'critical';
    }
  }

  return { status, details };
}