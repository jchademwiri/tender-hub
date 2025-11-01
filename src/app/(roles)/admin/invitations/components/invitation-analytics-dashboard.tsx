"use client";

import {
  Activity,
  AlertCircle,
  Calendar,
  Clock,
  Download,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ConversionRateChart,
  InvitationStatusChart,
  InvitationTrendsChart,
  ResponseTimeChart,
  RolePerformanceChart,
} from "./invitation-charts";

interface InvitationAnalytics {
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  expiredInvitations: number;
  cancelledInvitations: number;
  recentInvitations: number;
  conversionRate: number;
  averageResponseTime: number;
  byRole: {
    admin: { sent: number; accepted: number; rate: number };
    manager: { sent: number; accepted: number; rate: number };
    user: { sent: number; accepted: number; rate: number };
  };
  trends: Array<{
    date: string;
    total: number;
    accepted: number;
    pending: number;
    expired: number;
    conversionRate: number;
  }>;
  weeklyStats: Array<{
    week: string;
    total: number;
    accepted: number;
    conversionRate: number;
  }>;
  events: Array<{
    type: string;
    name: string;
    count: number;
  }>;
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
}

interface InvitationAnalyticsDashboardProps {
  className?: string;
}

export function InvitationAnalyticsDashboard({
  className,
}: InvitationAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<InvitationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [exportFormat, _setExportFormat] = useState("csv");

  // Fetch analytics data
  const fetchAnalytics = useCallback(
    async (range = timeRange) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          analytics: "true",
          period: range,
        });

        const response = await fetch(
          `/api/admin/invitations/enhanced?${params}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const data = await response.json();
        setAnalytics(data.analytics);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    },
    [timeRange],
  );

  // Handle export
  const handleExport = useCallback(
    async (format: string) => {
      try {
        const params = new URLSearchParams({
          analytics: "true",
          export: format,
          period: timeRange,
        });

        const response = await fetch(
          `/api/admin/invitations/enhanced?${params}`,
        );
        if (!response.ok) {
          throw new Error("Export failed");
        }

        // For CSV, trigger download
        if (format === "csv") {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `invitation-analytics-${new Date().toISOString().split("T")[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success("Analytics data exported successfully");
        }
      } catch (error) {
        console.error("Export error:", error);
        toast.error("Failed to export analytics data");
      }
    },
    [timeRange],
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;
  const formatHours = (num: number) => `${num.toFixed(1)}h`;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Invitation Analytics
          </h2>
          <p className="text-muted-foreground">
            Insights into invitation system performance and user onboarding
            metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport(exportFormat)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invitations
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics.totalInvitations)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analytics.recentInvitations)} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analytics.conversionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analytics.acceptedInvitations)} of{" "}
              {formatNumber(analytics.totalInvitations)} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(analytics.averageResponseTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              Time to accept invitation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics.pendingInvitations)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
      </div>

      {/* Role-based Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance by Role
          </CardTitle>
          <CardDescription>
            Invitation success rates across different user roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(analytics.byRole).map(([role, stats]) => (
              <div key={role} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{role}</span>
                  <Badge
                    variant={
                      stats.rate > 50
                        ? "default"
                        : stats.rate > 25
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {formatPercentage(stats.rate)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatNumber(stats.accepted)} of {formatNumber(stats.sent)}{" "}
                  accepted
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${stats.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <InvitationTrendsChart data={analytics.trends} />
        <ConversionRateChart
          data={analytics.trends.map((trend) => ({
            date: trend.date,
            conversionRate: trend.conversionRate,
          }))}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RolePerformanceChart data={analytics.byRole} />
        <InvitationStatusChart
          totalInvitations={analytics.totalInvitations}
          pendingInvitations={analytics.pendingInvitations}
          acceptedInvitations={analytics.acceptedInvitations}
          expiredInvitations={analytics.expiredInvitations}
          cancelledInvitations={analytics.cancelledInvitations}
        />
      </div>

      {/* Response Time Chart - only show if we have data */}
      {analytics.trends.some((trend) => trend.total > 0) && (
        <ResponseTimeChart
          data={analytics.trends.map((trend) => ({
            date: trend.date,
            averageResponseTime: analytics.averageResponseTime, // Using overall average for now
          }))}
        />
      )}

      {/* Weekly Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Performance
          </CardTitle>
          <CardDescription>
            Week-over-week invitation performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.weeklyStats.slice(0, 5).map((week, _index) => (
              <div
                key={week.week}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    Week of {new Date(week.week).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(week.total)} invitations sent
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {formatPercentage(week.conversionRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(week.accepted)} accepted
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest invitation events and interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.events.slice(0, 5).map((event, index) => (
              <div
                key={`${event.type}-${index}`}
                className="flex items-center justify-between p-2 border-l-2 border-muted pl-3"
              >
                <div>
                  <div className="font-medium">{event.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {event.type.replace("_", " ")}
                  </div>
                </div>
                <Badge variant="outline">
                  {formatNumber(event.count)} events
                </Badge>
              </div>
            ))}
            {analytics.events.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No recent activity to display
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
