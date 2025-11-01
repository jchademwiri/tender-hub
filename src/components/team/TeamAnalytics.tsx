"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Crown,
  Download,
  Shield,
  TrendingUp,
  User,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamAnalyticsData {
  overview: {
    totalMembers: number;
    activeMembers: number;
    suspendedMembers: number;
    pendingMembers: number;
    conversionRate: number;
  };
  roleDistribution: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  activityTrends: Array<{
    date: string;
    newMembers: number;
    activeMembers: number;
    suspendedMembers: number;
  }>;
  invitationMetrics: {
    totalInvitations: number;
    acceptedInvitations: number;
    pendingInvitations: number;
    expiredInvitations: number;
    cancelledInvitations: number;
    averageResponseTime: number;
    conversionRate: number;
  };
  recentActivity: Array<{
    id: string;
    type:
      | "member_joined"
      | "member_suspended"
      | "member_activated"
      | "member_deleted"
      | "invitation_sent";
    description: string;
    timestamp: Date;
    userId?: string;
    targetUserId?: string;
  }>;
}

interface TeamAnalyticsProps {
  className?: string;
}

const COLORS = {
  primary: "#3b82f6",
  secondary: "#64748b",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
  pink: "#ec4899",
};

const ROLE_COLORS = {
  owner: COLORS.warning,
  admin: COLORS.danger,
  manager: COLORS.primary,
  user: COLORS.secondary,
};

const _STATUS_COLORS = {
  active: COLORS.success,
  suspended: COLORS.danger,
  pending: COLORS.warning,
};

export function TeamAnalytics({ className }: TeamAnalyticsProps) {
  const [period, setPeriod] = useState<string>("30d");
  const [includeActivity, _setIncludeActivity] = useState(false);

  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["team-analytics", period, includeActivity],
    queryFn: async () => {
      const response = await fetch(
        `/api/team/analytics?period=${period}&includeActivity=${includeActivity}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      return response.json() as Promise<TeamAnalyticsData>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    try {
      const response = await fetch("/api/team/analytics/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format, period, includeActivity }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `team-analytics-${period}-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const chartConfig = useMemo(
    () => ({
      newMembers: {
        label: "New Members",
        color: COLORS.primary,
      },
      activeMembers: {
        label: "Active Members",
        color: COLORS.success,
      },
      suspendedMembers: {
        label: "Suspended Members",
        color: COLORS.danger,
      },
    }),
    [],
  );

  const roleChartConfig = useMemo(
    () => ({
      owner: {
        label: "Owner",
        color: ROLE_COLORS.owner,
      },
      admin: {
        label: "Admin",
        color: ROLE_COLORS.admin,
      },
      manager: {
        label: "Manager",
        color: ROLE_COLORS.manager,
      },
      user: {
        label: "User",
        color: ROLE_COLORS.user,
      },
    }),
    [],
  );

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Team Analytics</h2>
            <p className="text-muted-foreground">
              Comprehensive team insights and metrics
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Loading...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Team Analytics</h2>
            <p className="text-muted-foreground">
              Comprehensive team insights and metrics
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Failed to load analytics data
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive team insights and metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.overview.totalMembers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Members
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.overview.activeMembers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suspended Members
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analyticsData.overview.suspendedMembers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData.overview.conversionRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Activity Trends</TabsTrigger>
          <TabsTrigger value="roles">Role Distribution</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          {includeActivity && (
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={analyticsData.activityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="newMembers"
                    stackId="1"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="activeMembers"
                    stackId="2"
                    stroke={COLORS.success}
                    fill={COLORS.success}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="suspendedMembers"
                    stackId="3"
                    stroke={COLORS.danger}
                    fill={COLORS.danger}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={roleChartConfig} className="h-[300px]">
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.roleDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ role, percentage }: any) =>
                        `${role}: ${percentage}%`
                      }
                    >
                      {analyticsData.roleDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            ROLE_COLORS[
                              entry.role as keyof typeof ROLE_COLORS
                            ] || COLORS.secondary
                          }
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.roleDistribution.map((role) => (
                  <div
                    key={role.role}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {role.role === "owner" && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      {role.role === "admin" && (
                        <Shield className="h-4 w-4 text-red-500" />
                      )}
                      {role.role === "manager" && (
                        <UserCheck className="h-4 w-4 text-blue-500" />
                      )}
                      {role.role === "user" && (
                        <User className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="capitalize">{role.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{role.count}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {role.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Invitations
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.invitationMetrics.totalInvitations}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.invitationMetrics.acceptedInvitations}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <User className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {analyticsData.invitationMetrics.pendingInvitations}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.invitationMetrics.conversionRate}%
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {includeActivity && (
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Team Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.recentActivity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No recent activity
                    </p>
                  ) : (
                    analyticsData.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {activity.type === "member_joined" && (
                            <UserCheck className="h-5 w-5 text-green-500" />
                          )}
                          {activity.type === "member_suspended" && (
                            <UserX className="h-5 w-5 text-red-500" />
                          )}
                          {activity.type === "member_activated" && (
                            <UserCheck className="h-5 w-5 text-blue-500" />
                          )}
                          {activity.type === "member_deleted" && (
                            <UserX className="h-5 w-5 text-red-500" />
                          )}
                          {activity.type === "invitation_sent" && (
                            <Users className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(activity.timestamp),
                              "MMM dd, yyyy 'at' HH:mm",
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
