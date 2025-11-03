import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle, Database, Mail, Server, Zap, Shield } from "lucide-react";

interface ServiceHealth {
  service: string;
  status: "healthy" | "warning" | "critical";
  responseTime: number;
  details?: any;
  error?: string;
}

export async function SystemHealthMonitor() {
  const healthData = await fetchSystemHealth();

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case "database":
      case "neon_database":
        return <Database className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "performance_monitor":
        return <Zap className="h-4 w-4" />;
      case "cache_system":
        return <Server className="h-4 w-4" />;
      case "sentry_monitoring":
        return <Shield className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 border-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 border-yellow-600 bg-yellow-50";
      case "critical":
        return "text-red-600 border-red-600 bg-red-50";
      default:
        return "text-gray-600 border-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Server className="h-4 w-4 text-gray-600" />;
    }
  };

  const healthPercentage = (healthData.summary.healthy / healthData.summary.total) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Overall Health Summary */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(healthData.status)}
            System Health Overview
          </CardTitle>
          <CardDescription>
            Real-time status of all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Health</span>
              <span className="text-sm text-muted-foreground">
                {healthData.summary.healthy}/{healthData.summary.total} services
              </span>
            </div>
            <Progress value={healthPercentage} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {healthData.summary.healthy}
                </div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {healthData.summary.warning}
                </div>
                <div className="text-xs text-muted-foreground">Warning</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {healthData.summary.critical}
                </div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Service Status */}
      {healthData.services.map((service: ServiceHealth) => (
        <Card key={service.service}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getServiceIcon(service.service)}
              {formatServiceName(service.service)}
            </CardTitle>
            {getStatusIcon(service.status)}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className={getStatusColor(service.status)}>
                {service.status.toUpperCase()}
              </Badge>
              
              <div className="text-xs text-muted-foreground">
                Response Time: {service.responseTime}ms
              </div>
              
              {service.error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {service.error}
                </div>
              )}
              
              {service.details && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {Object.entries(service.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/_/g, " ")}:</span>
                      <span className="font-mono">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Uptime</span>
              <span className="text-sm font-medium">{formatUptime(healthData.uptime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Environment</span>
              <Badge variant="outline">{healthData.environment}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Version</span>
              <span className="text-sm font-medium font-mono">{healthData.version}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Last Check</span>
              <span className="text-sm font-medium">
                {new Date(healthData.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function fetchSystemHealth() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`, {
      cache: "no-store",
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch system health:", error);
    
    return {
      success: false,
      status: "critical",
      timestamp: new Date().toISOString(),
      uptime: 0,
      version: "unknown",
      environment: process.env.NODE_ENV || "unknown",
      services: [
        {
          service: "health_check",
          status: "critical",
          responseTime: 0,
          error: "Unable to connect to health check endpoint",
        },
      ],
      summary: {
        total: 1,
        healthy: 0,
        warning: 0,
        critical: 1,
      },
    };
  }
}

function formatServiceName(serviceName: string): string {
  return serviceName
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}