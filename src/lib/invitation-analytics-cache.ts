import { useState, useEffect, useCallback } from "react";
import { db } from "@/db";
import { analyticsCache } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  expiresAt: Date;
  createdAt: Date;
  hitCount: number;
  lastAccessed: Date;
}

export interface AnalyticsCacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum cache size
  enableCompression?: boolean;
}

/**
 * Analytics caching service for improved performance
 */
export class InvitationAnalyticsCache {
  private static instance: InvitationAnalyticsCache;
  private memoryCache = new Map<string, CacheEntry>();
  private options: Required<AnalyticsCacheOptions>;

  constructor(options: AnalyticsCacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 300, // 5 minutes default
      maxSize: options.maxSize || 100,
      enableCompression: options.enableCompression || false
    };
  }

  static getInstance(options?: AnalyticsCacheOptions): InvitationAnalyticsCache {
    if (!InvitationAnalyticsCache.instance) {
      InvitationAnalyticsCache.instance = new InvitationAnalyticsCache(options);
    }
    return InvitationAnalyticsCache.instance;
  }

  /**
   * Generate cache key for analytics data
   */
  private generateCacheKey(type: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');

    return `invitation_analytics:${type}:${sortedParams}`;
  }

  /**
   * Get data from cache
   */
  async get<T>(type: string, params: Record<string, any> = {}): Promise<T | null> {
    const key = this.generateCacheKey(type, params);

    try {
      // Try memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && memoryEntry.expiresAt > new Date()) {
        // Update hit count and last accessed
        memoryEntry.hitCount++;
        memoryEntry.lastAccessed = new Date();
        this.memoryCache.set(key, memoryEntry);
        return memoryEntry.data as T;
      }

      // Try database cache
      const dbEntries = await db
        .select()
        .from(analyticsCache)
        .where(
          and(
            eq(analyticsCache.cacheKey, key),
            gte(analyticsCache.expiresAt, new Date())
          )
        )
        .limit(1);

      if (dbEntries.length > 0) {
        const entry = dbEntries[0];
        const data = JSON.parse(entry.data as string);

        // Update hit count in database
        await db
          .update(analyticsCache)
          .set({
            hitCount: (entry.hitCount || 0) + 1,
            lastAccessed: new Date()
          })
          .where(eq(analyticsCache.cacheKey, key));

        // Store in memory cache for faster future access
        this.memoryCache.set(key, {
          key,
          data,
          expiresAt: entry.expiresAt,
          createdAt: entry.createdAt,
          hitCount: (entry.hitCount || 0) + 1,
          lastAccessed: new Date()
        });

        return data as T;
      }

      return null;
    } catch (error) {
      console.error("Error retrieving from cache:", error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(type: string, params: Record<string, any>, data: T): Promise<void> {
    const key = this.generateCacheKey(type, params);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (this.options.ttl * 1000));

    try {
      // Prepare data for storage
      const cacheData = {
        cacheKey: key,
        queryHash: this.generateQueryHash(type, params),
        data: JSON.stringify(data),
        expiresAt,
        hitCount: 0,
        lastAccessed: now,
        createdAt: now
      };

      // Store in database
      await db.insert(analyticsCache).values(cacheData);

      // Store in memory cache
      this.memoryCache.set(key, {
        key,
        data,
        expiresAt,
        createdAt: now,
        hitCount: 0,
        lastAccessed: now
      });

      // Manage memory cache size
      this.enforceMemoryCacheSize();

    } catch (error) {
      console.error("Error storing in cache:", error);
      throw error;
    }
  }

  /**
   * Delete cache entry
   */
  async delete(type: string, params: Record<string, any> = {}): Promise<void> {
    const key = this.generateCacheKey(type, params);

    try {
      // Remove from database
      await db
        .delete(analyticsCache)
        .where(eq(analyticsCache.cacheKey, key));

      // Remove from memory
      this.memoryCache.delete(key);

    } catch (error) {
      console.error("Error deleting from cache:", error);
      throw error;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await db.delete(analyticsCache);
      this.memoryCache.clear();
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw error;
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    try {
      const now = new Date();

      // Clean database
      const deletedEntries = await db
        .delete(analyticsCache)
        .where(lte(analyticsCache.expiresAt, now));

      // Clean memory cache
      let memoryDeleted = 0;
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expiresAt <= now) {
          this.memoryCache.delete(key);
          memoryDeleted++;
        }
      }

      return memoryDeleted; // Database operations don't return affected row count in this format
    } catch (error) {
      console.error("Error cleaning up cache:", error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memoryEntries: number;
    dbEntries: number;
    hitRate: number;
    memoryUsage: number;
  }> {
    try {
      const dbStats = await db
        .select({
          count: sql<number>`count(*)`,
          totalHits: sql<number>`sum(${analyticsCache.hitCount})`
        })
        .from(analyticsCache);

      const totalEntries = Number(dbStats[0]?.count || 0);
      const totalHits = Number(dbStats[0]?.totalHits || 0);

      return {
        memoryEntries: this.memoryCache.size,
        dbEntries: totalEntries,
        hitRate: totalEntries > 0 ? (totalHits / totalEntries) * 100 : 0,
        memoryUsage: Math.round((this.memoryCache.size / this.options.maxSize) * 100)
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return {
        memoryEntries: 0,
        dbEntries: 0,
        hitRate: 0,
        memoryUsage: 0
      };
    }
  }

  /**
   * Generate query hash for cache invalidation
   */
  private generateQueryHash(type: string, params: Record<string, any>): string {
    const queryString = `${type}:${JSON.stringify(params)}`;
    let hash = 0;
    for (let i = 0; i < queryString.length; i++) {
      const char = queryString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Enforce memory cache size limits
   */
  private enforceMemoryCacheSize(): void {
    if (this.memoryCache.size >= this.options.maxSize) {
      // Remove least recently used entries
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());

      const toRemove = Math.floor(this.options.maxSize * 0.2); // Remove 20%
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
    }
  }
}

/**
 * Real-time analytics update hook for React components
 */
export function useRealtimeAnalytics<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  interval: number = 30000 // 30 seconds default
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetcher();
      setData(result);
      setLastUpdated(new Date());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    if (interval > 0) {
      const timer = setInterval(fetchData, interval);
      return () => clearInterval(timer);
    }
  }, [fetchData, interval]);

  return { data, loading, error, lastUpdated, refresh };
}

/**
 * Cache key generators for different analytics types
 */
export const cacheKeys = {
  invitationAnalytics: (period?: string, filters?: Record<string, any>) =>
    `invitation_analytics:${period || '30d'}:${JSON.stringify(filters || {})}`,

  performanceMetrics: (from: Date, to: Date) =>
    `performance_metrics:${from.toISOString()}:${to.toISOString()}`,

  invitationTrends: (days: number) =>
    `invitation_trends:${days}`,

  rolePerformance: (period: string) =>
    `role_performance:${period}`
};