import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

interface SystemStatusProps {
  className?: string;
}

export async function SystemStatus({ className }: SystemStatusProps) {
  // Fetch system health data from the health check API
  const healthData = await fetchSystemHealth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 border-green-600";
      case "warning":
        return "text-yellow-600 border-yellow-600";
      case "critical":
        return "text-red-600 border-red-600";
      default:
        return "text-gray-600 border-gray-600";
    }
  };

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
          {getStatusIcon(healthData.status)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{healthData.status}</div>
          <p className="text-xs text-muted-foreground">
            {healthData.summary.healthy}/{healthData.summary.total} services healthy
          </p>
          <Badge variant="outline" className={`mt-2 ${getStatusColor(healthData.status)}`}>
            {healthData.environment}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatUptime(healthData.uptime)}</div>
          <p className="text-xs text-muted-foreground">
            Since last restart
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          {healthData.services.find((s: any) => s.service === "database")?.responseTime! > 500 ? (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {healthData.services.find((s: any) => s.service === "database")?.responseTime || 0}ms
          </div>
          <p className="text-xs text-muted-foreground">
            Database query time
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Version</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{healthData.version}</div>
          <p className="text-xs text-muted-foreground">
            Current deployment
          </p>
          <Badge variant="outline" className="mt-2">
            {new Date(healthData.timestamp).toLocaleTimeString()}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

async function fetchSystemHealth() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`, {
      cache: "no-store", // Always fetch fresh data
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch system health:", error);
    
    // Return fallback data
    return {
      success: false,
      status: "critical",
      timestamp: new Date().toISOString(),
      uptime: 0,
      version: "unknown",
      environment: process.env.NODE_ENV || "unknown",
      services: [],
      summary: {
        total: 0,
        healthy: 0,
        warning: 0,
        critical: 1,
      },
    };
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}