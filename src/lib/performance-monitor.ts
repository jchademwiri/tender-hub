/**
 * Production performance monitoring and metrics system
 * Tracks API response times, database query performance, memory usage, and system metrics
 */

import { getCacheHealth, cacheInvalidator } from "./cache-production";

// Use performance API that works in both Node.js and browser environments
const getPerformanceNow = (): number => {
  if (typeof performance !== 'undefined') {
    return performance.now();
  }
  // Fallback for environments without performance API
  return Date.now();
};

/**
 * Performance metric interfaces
 */
export interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  requestSize?: number;
  responseSize?: number;
}

export interface DatabaseMetric {
  query: string;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION';
  executionTime: number;
  rowsAffected?: number;
  timestamp: Date;
  userId?: string;
  cached: boolean;
}

export interface MemoryMetric {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: Date;
}

export interface SystemMetric {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  cacheHitRate: number;
  timestamp: Date;
}

/**
 * Performance metrics aggregation
 */
export interface MetricsAggregation {
  api: {
    totalRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    requestsPerSecond: number;
  };
  database: {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    cacheHitRate: number;
  };
  system: {
    averageCpuUsage: number;
    averageMemoryUsage: number;
    peakMemoryUsage: number;
    uptime: number;
  };
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private apiMetrics: APIMetric[] = [];
  private dbMetrics: DatabaseMetric[] = [];
  private memoryMetrics: MemoryMetric[] = [];
  private systemMetrics: SystemMetric[] = [];
  private startTime = Date.now();
  private maxMetricsHistory = 10000; // Keep last 10k metrics
  private metricsCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMetricsCleanup();
    this.startMemoryMonitoring();
  }

  /**
   * Track API request performance
   */
  trackAPIRequest(metric: APIMetric): void {
    this.apiMetrics.push(metric);
    this.cleanupOldMetrics();

    // Log slow requests
    if (metric.responseTime > 1000) {
      console.warn(`Slow API request: ${metric.method} ${metric.endpoint} - ${metric.responseTime}ms`);
    }

    // Log errors
    if (metric.statusCode >= 400) {
      console.error(`API error: ${metric.method} ${metric.endpoint} - ${metric.statusCode}`);
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(metric: DatabaseMetric): void {
    this.dbMetrics.push(metric);
    this.cleanupOldMetrics();

    // Log slow queries
    if (metric.executionTime > 100) {
      console.warn(`Slow database query: ${metric.queryType} - ${metric.executionTime}ms`);
    }
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(): void {
    // Only track memory usage in Node.js environment
    if (typeof process === 'undefined' || !process.memoryUsage) {
      return;
    }

    const memUsage = process.memoryUsage();
    const metric: MemoryMetric = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      timestamp: new Date(),
    };

    this.memoryMetrics.push(metric);
    this.cleanupOldMetrics();

    // Log high memory usage
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (memoryUsagePercent > 90) {
      console.warn(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
    }
  }

  /**
   * Track system metrics
   */
  trackSystemMetrics(metric: SystemMetric): void {
    this.systemMetrics.push(metric);
    this.cleanupOldMetrics();

    // Log high resource usage
    if (metric.cpuUsage > 80) {
      console.warn(`High CPU usage: ${metric.cpuUsage}%`);
    }
    if (metric.memoryUsage > 80) {
      console.warn(`High memory usage: ${metric.memoryUsage}%`);
    }
  }

  /**
   * Get API metrics aggregation
   */
  getAPIMetrics(timeRange?: { start: Date; end: Date }): MetricsAggregation['api'] {
    const metrics = this.filterMetricsByTime(this.apiMetrics, timeRange);
    
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        requestsPerSecond: 0,
      };
    }

    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const errors = metrics.filter(m => m.statusCode >= 400).length;
    const timeSpan = timeRange 
      ? (timeRange.end.getTime() - timeRange.start.getTime()) / 1000
      : (Date.now() - this.startTime) / 1000;

    return {
      totalRequests: metrics.length,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
      errorRate: (errors / metrics.length) * 100,
      requestsPerSecond: metrics.length / timeSpan,
    };
  }

  /**
   * Get database metrics aggregation
   */
  getDatabaseMetrics(timeRange?: { start: Date; end: Date }): MetricsAggregation['database'] {
    const metrics = this.filterMetricsByTime(this.dbMetrics, timeRange);
    
    if (metrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        cacheHitRate: 0,
      };
    }

    const slowQueries = metrics.filter(m => m.executionTime > 100).length;
    const cachedQueries = metrics.filter(m => m.cached).length;

    return {
      totalQueries: metrics.length,
      averageQueryTime: metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length,
      slowQueries,
      cacheHitRate: (cachedQueries / metrics.length) * 100,
    };
  }

  /**
   * Get system metrics aggregation
   */
  getSystemMetrics(timeRange?: { start: Date; end: Date }): MetricsAggregation['system'] {
    const metrics = this.filterMetricsByTime(this.systemMetrics, timeRange);
    
    if (metrics.length === 0) {
      return {
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        uptime: (Date.now() - this.startTime) / 1000,
      };
    }

    return {
      averageCpuUsage: metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length,
      averageMemoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
      peakMemoryUsage: Math.max(...metrics.map(m => m.memoryUsage)),
      uptime: (Date.now() - this.startTime) / 1000,
    };
  }

  /**
   * Get comprehensive metrics aggregation
   */
  getMetricsAggregation(timeRange?: { start: Date; end: Date }): MetricsAggregation {
    return {
      api: this.getAPIMetrics(timeRange),
      database: this.getDatabaseMetrics(timeRange),
      system: this.getSystemMetrics(timeRange),
    };
  }

  /**
   * Get real-time performance dashboard data
   */
  getDashboardMetrics(): {
    current: {
      activeRequests: number;
      memoryUsage: number;
      cacheHealth: ReturnType<typeof getCacheHealth>;
    };
    recent: {
      avgResponseTime: number;
      errorRate: number;
      requestsPerMinute: number;
      slowQueries: number;
    };
  } {
    const last5Minutes = {
      start: new Date(Date.now() - 5 * 60 * 1000),
      end: new Date(),
    };

    const recentAPI = this.getAPIMetrics(last5Minutes);
    const recentDB = this.getDatabaseMetrics(last5Minutes);
    
    // Get memory usage safely
    let memoryUsagePercent = 0;
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    }

    return {
      current: {
        activeRequests: 0, // This would be tracked separately in a real implementation
        memoryUsage: memoryUsagePercent,
        cacheHealth: getCacheHealth(),
      },
      recent: {
        avgResponseTime: recentAPI.averageResponseTime,
        errorRate: recentAPI.errorRate,
        requestsPerMinute: recentAPI.requestsPerSecond * 60,
        slowQueries: recentDB.slowQueries,
      },
    };
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts(): Array<{
    type: 'warning' | 'critical';
    message: string;
    timestamp: Date;
    metric: string;
    value: number;
  }> {
    const alerts: Array<{
      type: 'warning' | 'critical';
      message: string;
      timestamp: Date;
      metric: string;
      value: number;
    }> = [];

    const recent = this.getDashboardMetrics();
    const cacheHealth = getCacheHealth();

    // API performance alerts
    if (recent.recent.avgResponseTime > 1000) {
      alerts.push({
        type: recent.recent.avgResponseTime > 2000 ? 'critical' : 'warning',
        message: `High average response time: ${recent.recent.avgResponseTime.toFixed(0)}ms`,
        timestamp: new Date(),
        metric: 'api_response_time',
        value: recent.recent.avgResponseTime,
      });
    }

    // Error rate alerts
    if (recent.recent.errorRate > 5) {
      alerts.push({
        type: recent.recent.errorRate > 10 ? 'critical' : 'warning',
        message: `High error rate: ${recent.recent.errorRate.toFixed(1)}%`,
        timestamp: new Date(),
        metric: 'error_rate',
        value: recent.recent.errorRate,
      });
    }

    // Memory usage alerts
    if (recent.current.memoryUsage > 80) {
      alerts.push({
        type: recent.current.memoryUsage > 90 ? 'critical' : 'warning',
        message: `High memory usage: ${recent.current.memoryUsage.toFixed(1)}%`,
        timestamp: new Date(),
        metric: 'memory_usage',
        value: recent.current.memoryUsage,
      });
    }

    // Cache health alerts
    if (cacheHealth.status !== 'healthy') {
      alerts.push({
        type: cacheHealth.status === 'critical' ? 'critical' : 'warning',
        message: `Cache health: ${cacheHealth.status}`,
        timestamp: new Date(),
        metric: 'cache_health',
        value: 0,
      });
    }

    return alerts;
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    const metrics = this.getMetricsAggregation();
    
    if (format === 'prometheus') {
      return this.formatPrometheusMetrics(metrics);
    }

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics,
      alerts: this.getPerformanceAlerts(),
    }, null, 2);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.apiMetrics = [];
    this.dbMetrics = [];
    this.memoryMetrics = [];
    this.systemMetrics = [];
  }

  /**
   * Destroy monitor and cleanup resources
   */
  destroy(): void {
    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
    }
    this.clearMetrics();
  }

  /**
   * Filter metrics by time range
   */
  private filterMetricsByTime<T extends { timestamp: Date }>(
    metrics: T[],
    timeRange?: { start: Date; end: Date }
  ): T[] {
    if (!timeRange) return metrics;

    return metrics.filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  /**
   * Cleanup old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    if (this.apiMetrics.length > this.maxMetricsHistory) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetricsHistory);
    }
    if (this.dbMetrics.length > this.maxMetricsHistory) {
      this.dbMetrics = this.dbMetrics.slice(-this.maxMetricsHistory);
    }
    if (this.memoryMetrics.length > this.maxMetricsHistory) {
      this.memoryMetrics = this.memoryMetrics.slice(-this.maxMetricsHistory);
    }
    if (this.systemMetrics.length > this.maxMetricsHistory) {
      this.systemMetrics = this.systemMetrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Start automatic metrics cleanup
   */
  private startMetricsCleanup(): void {
    this.metricsCleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Cleanup every minute
  }

  /**
   * Start automatic memory monitoring
   */
  private startMemoryMonitoring(): void {
    setInterval(() => {
      this.trackMemoryUsage();
    }, 30000); // Track memory every 30 seconds
  }

  /**
   * Format metrics for Prometheus
   */
  private formatPrometheusMetrics(metrics: MetricsAggregation): string {
    const lines: string[] = [];
    
    // API metrics
    lines.push(`# HELP api_requests_total Total number of API requests`);
    lines.push(`# TYPE api_requests_total counter`);
    lines.push(`api_requests_total ${metrics.api.totalRequests}`);
    
    lines.push(`# HELP api_response_time_seconds Average API response time`);
    lines.push(`# TYPE api_response_time_seconds gauge`);
    lines.push(`api_response_time_seconds ${metrics.api.averageResponseTime / 1000}`);
    
    lines.push(`# HELP api_error_rate Error rate percentage`);
    lines.push(`# TYPE api_error_rate gauge`);
    lines.push(`api_error_rate ${metrics.api.errorRate}`);

    // Database metrics
    lines.push(`# HELP db_queries_total Total number of database queries`);
    lines.push(`# TYPE db_queries_total counter`);
    lines.push(`db_queries_total ${metrics.database.totalQueries}`);
    
    lines.push(`# HELP db_query_time_seconds Average database query time`);
    lines.push(`# TYPE db_query_time_seconds gauge`);
    lines.push(`db_query_time_seconds ${metrics.database.averageQueryTime / 1000}`);

    // System metrics
    lines.push(`# HELP system_cpu_usage CPU usage percentage`);
    lines.push(`# TYPE system_cpu_usage gauge`);
    lines.push(`system_cpu_usage ${metrics.system.averageCpuUsage}`);
    
    lines.push(`# HELP system_memory_usage Memory usage percentage`);
    lines.push(`# TYPE system_memory_usage gauge`);
    lines.push(`system_memory_usage ${metrics.system.averageMemoryUsage}`);

    return lines.join('\n');
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware for tracking API performance
 */
export function createPerformanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = getPerformanceNow();
    const originalSend = res.send;

    res.send = function(data: any) {
      const endTime = getPerformanceNow();
      const responseTime = endTime - startTime;

      performanceMonitor.trackAPIRequest({
        endpoint: req.path || req.url,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        timestamp: new Date(),
        userId: req.user?.id,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        requestSize: req.get('Content-Length') ? parseInt(req.get('Content-Length')) : undefined,
        responseSize: data ? JSON.stringify(data).length : undefined,
      });

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Database query performance tracker
 */
export function trackDatabaseQuery<T>(
  queryFn: () => Promise<T>,
  queryInfo: {
    query: string;
    queryType: DatabaseMetric['queryType'];
    userId?: string;
    cached?: boolean;
  }
): Promise<T> {
  const startTime = getPerformanceNow();

  return queryFn().then(
    (result) => {
      const endTime = getPerformanceNow();
      const executionTime = endTime - startTime;

      performanceMonitor.trackDatabaseQuery({
        query: queryInfo.query,
        queryType: queryInfo.queryType,
        executionTime,
        timestamp: new Date(),
        userId: queryInfo.userId,
        cached: queryInfo.cached || false,
      });

      return result;
    },
    (error) => {
      const endTime = getPerformanceNow();
      const executionTime = endTime - startTime;

      performanceMonitor.trackDatabaseQuery({
        query: queryInfo.query,
        queryType: queryInfo.queryType,
        executionTime,
        timestamp: new Date(),
        userId: queryInfo.userId,
        cached: false,
      });

      throw error;
    }
  );
}

/**
 * Performance health check
 */
export function getPerformanceHealth(): {
  status: 'healthy' | 'warning' | 'critical';
  details: any;
} {
  const alerts = performanceMonitor.getPerformanceAlerts();
  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (criticalAlerts.length > 0) {
    status = 'critical';
  } else if (warningAlerts.length > 0) {
    status = 'warning';
  }

  return {
    status,
    details: {
      alerts: alerts.length,
      critical: criticalAlerts.length,
      warnings: warningAlerts.length,
      metrics: performanceMonitor.getDashboardMetrics(),
    },
  };
}