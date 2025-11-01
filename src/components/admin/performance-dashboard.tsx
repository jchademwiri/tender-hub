"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Activity, Database, Zap, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PerformanceData {
  timestamp: string;
  timeRange: string;
  health: {
    overall: 'healthy' | 'warning' | 'critical';
    performance: {
      status: 'healthy' | 'warning' | 'critical';
      details: any;
    };
    cache: {
      status: 'healthy' | 'warning' | 'critical';
      details: any;
    };
  };
  metrics: {
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
    realTime: {
      current: {
        activeRequests: number;
        memoryUsage: number;
        cacheHealth: any;
      };
      recent: {
        avgResponseTime: number;
        errorRate: number;
        requestsPerMinute: number;
        slowQueries: number;
      };
    };
  };
  alerts: Array<{
    type: 'warning' | 'critical';
    message: string;
    timestamp: string;
    metric: string;
    value: number;
  }>;
  cache: {
    health: any;
    stats: Record<string, any>;
  };
  system: {
    uptime: number;
    memory: any;
    version: string;
    platform: string;
  };
}

export function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/performance?timeRange=${timeRange}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearMetrics = async () => {
    try {
      const response = await fetch('/api/admin/performance/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_metrics' }),
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to clear metrics:', error);
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch('/api/admin/performance/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_cache' }),
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, timeRange]);

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load performance data</p>
        <Button onClick={fetchData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            System performance metrics and health monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5 minutes</SelectItem>
              <SelectItem value="15m">15 minutes</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="6h">6 hours</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getHealthBadgeVariant(data.health.overall)}>
              {data.health.overall.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getHealthBadgeVariant(data.health.performance.status)}>
              {data.health.performance.status.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Health</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getHealthBadgeVariant(data.health.cache.status)}>
              {data.health.cache.status.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          {data.alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.type.toUpperCase()}:</strong> {alert.message}
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Real-time Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.realTime.recent.avgResponseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.realTime.recent.errorRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.realTime.current.memoryUsage.toFixed(1)}%
            </div>
            <Progress value={data.metrics.realTime.current.memoryUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/Min</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.realTime.recent.requestsPerMinute.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* API Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>API Performance</CardTitle>
            <CardDescription>Request and response metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Requests</p>
                <p className="text-2xl font-bold">{data.metrics.api.totalRequests.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Requests/sec</p>
                <p className="text-2xl font-bold">{data.metrics.api.requestsPerSecond.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">P95 Response</p>
                <p className="text-2xl font-bold">{data.metrics.api.p95ResponseTime.toFixed(0)}ms</p>
              </div>
              <div>
                <p className="text-sm font-medium">P99 Response</p>
                <p className="text-2xl font-bold">{data.metrics.api.p99ResponseTime.toFixed(0)}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Database Performance</CardTitle>
            <CardDescription>Query execution metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Queries</p>
                <p className="text-2xl font-bold">{data.metrics.database.totalQueries.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Avg Query Time</p>
                <p className="text-2xl font-bold">{data.metrics.database.averageQueryTime.toFixed(1)}ms</p>
              </div>
              <div>
                <p className="text-sm font-medium">Slow Queries</p>
                <p className="text-2xl font-bold">{data.metrics.database.slowQueries}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{data.metrics.database.cacheHitRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Server and runtime details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium">Uptime</p>
              <p className="text-lg font-bold">{formatUptime(data.system.uptime)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Heap Used</p>
              <p className="text-lg font-bold">{formatBytes(data.system.memory.heapUsed)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Node Version</p>
              <p className="text-lg font-bold">{data.system.version}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Platform</p>
              <p className="text-lg font-bold">{data.system.platform}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Actions</CardTitle>
          <CardDescription>Clear metrics and cache for troubleshooting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" onClick={clearMetrics}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Metrics
            </Button>
            <Button variant="outline" onClick={clearCache}>
              <Database className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}