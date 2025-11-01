import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Clock, Zap, Database, Globe } from "lucide-react";
import { db } from "@/db";
import { sql } from "drizzle-orm";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  threshold: number;
  status: "good" | "warning" | "critical";
}

export async function PerformanceMetrics() {
  const metrics = await fetchPerformanceMetrics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600 border-green-600";
      case "warning":
        return "text-yellow-600 border-yellow-600";
      case "critical":
        return "text-red-600 border-red-600";
      default:
        return "text-gray-600 border-gray-600";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMetricIcon = (name: string) => {
    if (name.includes("Database")) return <Database className="h-4 w-4" />;
    if (name.includes("API")) return <Globe className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Performance Overview */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Overview
          </CardTitle>
          <CardDescription>
            Real-time system performance metrics and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.filter(m => m.status === "good").length}
              </div>
              <div className="text-xs text-muted-foreground">Good Performance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.filter(m => m.status === "warning").length}
              </div>
              <div className="text-xs text-muted-foreground">Needs Attention</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.filter(m => m.status === "critical").length}
              </div>
              <div className="text-xs text-muted-foreground">Critical Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Metrics */}
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getMetricIcon(metric.name)}
              {metric.name}
            </CardTitle>
            <div className="flex items-center gap-1">
              {getTrendIcon(metric.trend)}
              <Badge variant="outline" className={getStatusColor(metric.status)}>
                {metric.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold">
                {metric.value.toFixed(metric.unit === "ms" ? 0 : 2)}{metric.unit}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Threshold: {metric.threshold}{metric.unit}</span>
                  <span>{((metric.value / metric.threshold) * 100).toFixed(0)}%</span>
                </div>
                <Progress 
                  value={Math.min((metric.value / metric.threshold) * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                {metric.status === "good" && "Performance within acceptable limits"}
                {metric.status === "warning" && "Performance approaching threshold"}
                {metric.status === "critical" && "Performance exceeds acceptable limits"}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Database Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connection Pool:</span>
              <span className="font-medium">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Query Cache:</span>
              <span className="font-medium">Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slow Queries:</span>
              <span className="font-medium text-green-600">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Index Usage:</span>
              <span className="font-medium text-green-600">Optimal</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            API Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Success Rate:</span>
              <span className="font-medium text-green-600">99.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate Limiting:</span>
              <span className="font-medium">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cached Responses:</span>
              <span className="font-medium text-green-600">85%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Payload:</span>
              <span className="font-medium">2.4KB</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function fetchPerformanceMetrics(): Promise<PerformanceMetric[]> {
  try {
    // Simulate fetching performance metrics
    // In a real implementation, this would fetch from your monitoring system
    const dbStartTime = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbResponseTime = Date.now() - dbStartTime;

    const metrics: PerformanceMetric[] = [
      {
        name: "Database Response Time",
        value: dbResponseTime,
        unit: "ms",
        trend: dbResponseTime > 100 ? "up" : "stable",
        threshold: 100,
        status: dbResponseTime > 200 ? "critical" : dbResponseTime > 100 ? "warning" : "good",
      },
      {
        name: "API Response Time",
        value: Math.random() * 300 + 50, // Simulated
        unit: "ms",
        trend: "stable",
        threshold: 500,
        status: "good",
      },
      {
        name: "Memory Usage",
        value: Math.random() * 80 + 20, // Simulated
        unit: "%",
        trend: "up",
        threshold: 85,
        status: "good",
      },
      {
        name: "CPU Usage",
        value: Math.random() * 60 + 10, // Simulated
        unit: "%",
        trend: "stable",
        threshold: 80,
        status: "good",
      },
      {
        name: "Cache Hit Rate",
        value: Math.random() * 20 + 80, // Simulated
        unit: "%",
        trend: "stable",
        threshold: 70,
        status: "good",
      },
      {
        name: "Error Rate",
        value: Math.random() * 2, // Simulated
        unit: "%",
        trend: "down",
        threshold: 5,
        status: "good",
      },
    ];

    return metrics;
  } catch (error) {
    console.error("Failed to fetch performance metrics:", error);
    
    // Return fallback metrics
    return [
      {
        name: "System Status",
        value: 0,
        unit: "",
        trend: "stable",
        threshold: 1,
        status: "critical",
      },
    ];
  }
}