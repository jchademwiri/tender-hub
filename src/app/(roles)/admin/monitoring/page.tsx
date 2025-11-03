import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdmin } from "@/lib/auth-utils";
import { SystemHealthMonitor } from "./components/system-health-monitor";
import { PerformanceMetrics } from "./components/performance-metrics";
import { ErrorTracking } from "./components/error-tracking";
import { SystemStatus } from "./components/system-status";
import { AlertsPanel } from "./components/alerts-panel";

export default async function MonitoringDashboard() {
  // Ensure user has admin access
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time system health, performance metrics, and error tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            Live
          </Badge>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <Suspense fallback={<SystemStatusSkeleton />}>
        <SystemStatus />
      </Suspense>

      {/* Main Monitoring Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Suspense fallback={<MonitoringSkeleton />}>
            <SystemHealthMonitor />
          </Suspense>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Suspense fallback={<MonitoringSkeleton />}>
            <PerformanceMetrics />
          </Suspense>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Suspense fallback={<MonitoringSkeleton />}>
            <ErrorTracking />
          </Suspense>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Suspense fallback={<MonitoringSkeleton />}>
            <AlertsPanel />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SystemStatusSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MonitoringSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-5 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}