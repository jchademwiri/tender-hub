/**
 * Performance monitoring API endpoint
 * Provides system performance metrics and health status for administrators
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAPI } from "@/lib/auth-utils";
import { performanceMonitor, getPerformanceHealth } from "@/lib/performance-monitor";
import { getCacheHealth, cacheInvalidator } from "@/lib/cache-production";

/**
 * GET /api/admin/performance
 * Get comprehensive performance metrics and system health
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAPI();
    if (authResult.error) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '1h';
    const format = searchParams.get('format') || 'json';

    // Calculate time range
    const now = new Date();
    const timeRangeMs = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    }[timeRange] || 60 * 60 * 1000;

    const timeRangeFilter = {
      start: new Date(now.getTime() - timeRangeMs),
      end: now,
    };

    // Get performance metrics
    const metrics = performanceMonitor.getMetricsAggregation(timeRangeFilter);
    const dashboardMetrics = performanceMonitor.getDashboardMetrics();
    const alerts = performanceMonitor.getPerformanceAlerts();
    const performanceHealth = getPerformanceHealth();
    const cacheHealth = getCacheHealth();
    const cacheStats = cacheInvalidator.getAllStats();

    // Export in requested format
    if (format === 'prometheus') {
      const prometheusData = performanceMonitor.exportMetrics('prometheus');
      return new NextResponse(prometheusData, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    const responseData = {
      timestamp: now.toISOString(),
      timeRange,
      health: {
        overall: performanceHealth.status,
        performance: performanceHealth,
        cache: cacheHealth,
      },
      metrics: {
        ...metrics,
        realTime: dashboardMetrics,
      },
      alerts,
      cache: {
        health: cacheHealth,
        stats: cacheStats,
      },
      system: {
        uptime: typeof process !== 'undefined' ? process.uptime() : 0,
        memory: typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() : {},
        version: typeof process !== 'undefined' ? process.version : 'unknown',
        platform: typeof process !== 'undefined' ? process.platform : 'unknown',
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance metrics" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/performance/clear
 * Clear performance metrics (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAPI();
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear_metrics':
        performanceMonitor.clearMetrics();
        return NextResponse.json({ 
          success: true, 
          message: "Performance metrics cleared" 
        });

      case 'clear_cache':
        const clearedEntries = cacheInvalidator.cleanupAll();
        return NextResponse.json({ 
          success: true, 
          message: "Cache cleared",
          clearedEntries 
        });

      case 'invalidate_cache':
        const { pattern, cacheNames } = body;
        if (!pattern) {
          return NextResponse.json(
            { error: "Pattern is required for cache invalidation" },
            { status: 400 }
          );
        }
        const invalidatedCount = cacheInvalidator.invalidateByPattern(pattern, cacheNames);
        return NextResponse.json({ 
          success: true, 
          message: `Invalidated ${invalidatedCount} cache entries`,
          invalidatedCount 
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error performing performance action:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}