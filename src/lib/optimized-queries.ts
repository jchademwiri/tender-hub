/**
 * Optimized database queries for production performance
 * Provides single-query dashboard loading, efficient pagination, and query result caching
 */

import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  provinces,
  publishers,
  userBookmarks,
  user,
  sessions,
  pageViews,
  events,
  type Province,
  type Publisher,
  type User,
  type UserBookmark,
} from "@/db/schema";

/**
 * Dashboard data interface for single-query loading
 */
export interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  stats: {
    provinceCount: number;
    publisherCount: number;
    userBookmarkCount: number;
    recentActivityCount: number;
  };
  recentPublishers: Array<{
    id: string;
    name: string;
    website: string | null;
    provinceName: string | null;
    createdAt: Date;
  }>;
  userBookmarks: Array<{
    id: string;
    name: string;
    website: string | null;
    provinceName: string | null;
    bookmarkedAt: Date;
  }>;
}

/**
 * Single optimized query to load all dashboard data
 * Reduces database round trips from 4+ queries to 1 query with CTEs
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const dashboardQuery = sql`
    WITH stats AS (
      SELECT 
        (SELECT COUNT(*) FROM ${provinces}) as province_count,
        (SELECT COUNT(*) FROM ${publishers}) as publisher_count,
        (SELECT COUNT(*) FROM ${userBookmarks} WHERE user_id = ${userId}) as user_bookmark_count,
        (SELECT COUNT(*) FROM ${pageViews} WHERE user_id = ${userId} AND timestamp > NOW() - INTERVAL '7 days') as recent_activity_count
    ),
    recent_publishers AS (
      SELECT 
        p.id,
        p.name,
        p.website,
        pr.name as province_name,
        p.created_at
      FROM ${publishers} p
      LEFT JOIN ${provinces} pr ON p.province_id = pr.id
      ORDER BY p.created_at DESC
      LIMIT 5
    ),
    user_bookmarks AS (
      SELECT 
        p.id,
        p.name,
        p.website,
        pr.name as province_name,
        ub.created_at as bookmarked_at
      FROM ${userBookmarks} ub
      INNER JOIN ${publishers} p ON ub.publisher_id = p.id
      LEFT JOIN ${provinces} pr ON p.province_id = pr.id
      WHERE ub.user_id = ${userId}
      ORDER BY ub.created_at DESC
      LIMIT 10
    ),
    user_data AS (
      SELECT id, name, email, role
      FROM ${user}
      WHERE id = ${userId}
    )
    SELECT 
      json_build_object(
        'user', (SELECT row_to_json(user_data) FROM user_data),
        'stats', (SELECT row_to_json(stats) FROM stats),
        'recentPublishers', (SELECT json_agg(row_to_json(recent_publishers)) FROM recent_publishers),
        'userBookmarks', (SELECT json_agg(row_to_json(user_bookmarks)) FROM user_bookmarks)
      ) as dashboard_data
  `;

  const result = await db.execute(dashboardQuery);
  const dashboardData = result.rows[0]?.dashboard_data as any;

  return {
    user: dashboardData.user,
    stats: {
      provinceCount: dashboardData.stats.province_count,
      publisherCount: dashboardData.stats.publisher_count,
      userBookmarkCount: dashboardData.stats.user_bookmark_count,
      recentActivityCount: dashboardData.stats.recent_activity_count,
    },
    recentPublishers: dashboardData.recentPublishers || [],
    userBookmarks: dashboardData.userBookmarks || [],
  };
}

/**
 * Optimized publisher queries with efficient pagination
 */
export interface PublisherQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  provinceId?: string;
  sortBy?: 'name' | 'created_at' | 'province';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedPublishers {
  publishers: Array<{
    id: string;
    name: string;
    website: string | null;
    province_id: string;
    province_name: string | null;
    createdAt: Date;
    isBookmarked?: boolean;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Optimized publisher listing with single query for data + count
 */
export async function getOptimizedPublishers(
  options: PublisherQueryOptions = {},
  userId?: string
): Promise<PaginatedPublishers> {
  const {
    page = 1,
    limit = 20,
    search,
    provinceId,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;

  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [];
  if (search) {
    conditions.push(ilike(publishers.name, `%${search}%`));
  }
  if (provinceId) {
    conditions.push(eq(publishers.province_id, provinceId));
  }

  // Build ORDER BY clause
  let orderByClause;
  switch (sortBy) {
    case 'name':
      orderByClause = sortOrder === 'desc' ? desc(publishers.name) : publishers.name;
      break;
    case 'province':
      orderByClause = sortOrder === 'desc' ? desc(provinces.name) : provinces.name;
      break;
    default:
      orderByClause = sortOrder === 'desc' ? desc(publishers.createdAt) : publishers.createdAt;
  }

  // Single query with window function for count
  const publishersQuery = db
    .select({
      id: publishers.id,
      name: publishers.name,
      website: publishers.website,
      province_id: publishers.province_id,
      province_name: provinces.name,
      createdAt: publishers.createdAt,
      total_count: sql<number>`COUNT(*) OVER()`,
      ...(userId && {
        is_bookmarked: sql<boolean>`EXISTS(
          SELECT 1 FROM ${userBookmarks} 
          WHERE user_id = ${userId} AND publisher_id = ${publishers.id}
        )`
      })
    })
    .from(publishers)
    .leftJoin(provinces, eq(publishers.province_id, provinces.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const results = await publishersQuery;
  const totalCount = results[0]?.total_count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    publishers: results.map(row => ({
      id: row.id,
      name: row.name,
      website: row.website,
      province_id: row.province_id,
      province_name: row.province_name,
      createdAt: row.createdAt,
      ...(userId && { isBookmarked: row.is_bookmarked })
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Optimized province queries
 */
export interface ProvinceQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  includePublisherCount?: boolean;
}

export interface PaginatedProvinces {
  provinces: Array<{
    id: string;
    name: string;
    code: string;
    description: string | null;
    createdAt: Date;
    publisherCount?: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Optimized province listing with optional publisher counts
 */
export async function getOptimizedProvinces(
  options: ProvinceQueryOptions = {}
): Promise<PaginatedProvinces> {
  const {
    page = 1,
    limit = 20,
    search,
    includePublisherCount = false
  } = options;

  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [];
  if (search) {
    conditions.push(ilike(provinces.name, `%${search}%`));
  }

  // Query with optional publisher count
  const provincesQuery = db
    .select({
      id: provinces.id,
      name: provinces.name,
      code: provinces.code,
      description: provinces.description,
      createdAt: provinces.createdAt,
      total_count: sql<number>`COUNT(*) OVER()`,
      ...(includePublisherCount && {
        publisher_count: sql<number>`(
          SELECT COUNT(*) FROM ${publishers} 
          WHERE province_id = ${provinces.id}
        )`
      })
    })
    .from(provinces)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(provinces.createdAt))
    .limit(limit)
    .offset(offset);

  const results = await provincesQuery;
  const totalCount = results[0]?.total_count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    provinces: results.map(row => ({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      createdAt: row.createdAt,
      ...(includePublisherCount && { publisherCount: row.publisher_count })
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Optimized user bookmarks with efficient loading
 */
export async function getOptimizedUserBookmarks(
  userId: string,
  options: { page?: number; limit?: number } = {}
): Promise<PaginatedPublishers> {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const bookmarksQuery = db
    .select({
      id: publishers.id,
      name: publishers.name,
      website: publishers.website,
      province_id: publishers.province_id,
      province_name: provinces.name,
      createdAt: userBookmarks.createdAt,
      total_count: sql<number>`COUNT(*) OVER()`,
      is_bookmarked: sql<boolean>`true`
    })
    .from(userBookmarks)
    .innerJoin(publishers, eq(userBookmarks.publisherId, publishers.id))
    .leftJoin(provinces, eq(publishers.province_id, provinces.id))
    .where(eq(userBookmarks.userId, userId))
    .orderBy(desc(userBookmarks.createdAt))
    .limit(limit)
    .offset(offset);

  const results = await bookmarksQuery;
  const totalCount = results[0]?.total_count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    publishers: results.map(row => ({
      id: row.id,
      name: row.name,
      website: row.website,
      province_id: row.province_id,
      province_name: row.province_name,
      createdAt: row.createdAt,
      isBookmarked: row.is_bookmarked
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Optimized analytics queries for performance monitoring
 */
export interface AnalyticsQueryOptions {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface UserAnalytics {
  totalPageViews: number;
  uniqueSessions: number;
  averageSessionDuration: number;
  topPages: Array<{
    path: string;
    views: number;
    avgTimeOnPage: number;
  }>;
  recentActivity: Array<{
    timestamp: Date;
    action: string;
    page: string;
  }>;
}

/**
 * Get user analytics with optimized queries
 */
export async function getOptimizedUserAnalytics(
  userId: string,
  options: AnalyticsQueryOptions = {}
): Promise<UserAnalytics> {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate = new Date(),
    limit = 10
  } = options;

  // Single query with CTEs for all analytics data
  const analyticsQuery = sql`
    WITH user_sessions AS (
      SELECT 
        session_id,
        started_at,
        ended_at,
        duration,
        page_views
      FROM ${sessions}
      WHERE user_id = ${userId}
        AND started_at >= ${startDate}
        AND started_at <= ${endDate}
    ),
    user_page_views AS (
      SELECT 
        path,
        time_on_page,
        timestamp
      FROM ${pageViews}
      WHERE user_id = ${userId}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
    ),
    page_stats AS (
      SELECT 
        path,
        COUNT(*) as views,
        AVG(time_on_page) as avg_time_on_page
      FROM user_page_views
      GROUP BY path
      ORDER BY views DESC
      LIMIT ${limit}
    ),
    recent_events AS (
      SELECT 
        timestamp,
        event_name as action,
        page_path as page
      FROM ${events}
      WHERE user_id = ${userId}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    )
    SELECT 
      json_build_object(
        'totalPageViews', (SELECT COUNT(*) FROM user_page_views),
        'uniqueSessions', (SELECT COUNT(DISTINCT session_id) FROM user_sessions),
        'averageSessionDuration', (SELECT AVG(duration) FROM user_sessions WHERE duration IS NOT NULL),
        'topPages', (SELECT json_agg(row_to_json(page_stats)) FROM page_stats),
        'recentActivity', (SELECT json_agg(row_to_json(recent_events)) FROM recent_events)
      ) as analytics_data
  `;

  const result = await db.execute(analyticsQuery);
  const analyticsData = result.rows[0]?.analytics_data as any;

  return {
    totalPageViews: analyticsData.totalPageViews || 0,
    uniqueSessions: analyticsData.uniqueSessions || 0,
    averageSessionDuration: analyticsData.averageSessionDuration || 0,
    topPages: analyticsData.topPages || [],
    recentActivity: analyticsData.recentActivity || [],
  };
}

/**
 * Bulk operations for administrative functions
 */
export interface BulkOperationResult {
  success: boolean;
  affected: number;
  errors: string[];
}

/**
 * Bulk update publishers with optimized batch processing
 */
export async function bulkUpdatePublishers(
  updates: Array<{ id: string; data: Partial<Publisher> }>
): Promise<BulkOperationResult> {
  const errors: string[] = [];
  let affected = 0;

  try {
    // Use transaction for consistency
    await db.transaction(async (tx) => {
      for (const update of updates) {
        try {
          const result = await tx
            .update(publishers)
            .set(update.data)
            .where(eq(publishers.id, update.id));
          
          affected++;
        } catch (error) {
          errors.push(`Failed to update publisher ${update.id}: ${error}`);
        }
      }
    });

    return {
      success: errors.length === 0,
      affected,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      affected: 0,
      errors: [`Transaction failed: ${error}`],
    };
  }
}

/**
 * Query result caching utilities
 */
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Cache query results with TTL
 */
export function cacheQueryResult<T>(
  key: string,
  data: T,
  ttl: number = 300000 // 5 minutes default
): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Get cached query result
 */
export function getCachedQueryResult<T>(key: string): T | null {
  const cached = queryCache.get(key);
  
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp > cached.ttl) {
    queryCache.delete(key);
    return null;
  }

  return cached.data as T;
}

/**
 * Clear expired cache entries
 */
export function clearExpiredQueryCache(): void {
  const now = Date.now();
  for (const [key, cached] of queryCache.entries()) {
    if (now - cached.timestamp > cached.ttl) {
      queryCache.delete(key);
    }
  }
}

/**
 * Generate cache key for query parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

/**
 * Cached wrapper for expensive queries
 */
export async function withQueryCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 300000
): Promise<T> {
  // Check cache first
  const cached = getCachedQueryResult<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute query and cache result
  const result = await queryFn();
  cacheQueryResult(key, result, ttl);
  
  return result;
}