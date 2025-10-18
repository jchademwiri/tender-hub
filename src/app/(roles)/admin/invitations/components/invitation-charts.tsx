"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Mail, Clock } from "lucide-react";

interface InvitationTrendsChartProps {
  data: Array<{
    date: string;
    total: number;
    accepted: number;
    pending: number;
    expired: number;
    conversionRate: number;
  }>;
  className?: string;
}

export function InvitationTrendsChart({ data, className }: InvitationTrendsChartProps) {
  const chartConfig = {
    total: {
      label: "Total Sent",
      color: "hsl(var(--chart-1))",
    },
    accepted: {
      label: "Accepted",
      color: "hsl(var(--chart-2))",
    },
    pending: {
      label: "Pending",
      color: "hsl(var(--chart-3))",
    },
    expired: {
      label: "Expired",
      color: "hsl(var(--chart-4))",
    },
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Invitation Trends Over Time
        </CardTitle>
        <CardDescription>
          Daily invitation activity and conversion rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="total"
              stackId="1"
              stroke={chartConfig.total.color}
              fill={chartConfig.total.color}
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="accepted"
              stackId="2"
              stroke={chartConfig.accepted.color}
              fill={chartConfig.accepted.color}
              fillOpacity={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface ConversionRateChartProps {
  data: Array<{
    date: string;
    conversionRate: number;
  }>;
  className?: string;
}

export function ConversionRateChart({ data, className }: ConversionRateChartProps) {
  const chartConfig = {
    conversionRate: {
      label: "Conversion Rate",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Conversion Rate Trend
        </CardTitle>
        <CardDescription>
          Daily invitation conversion rates over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <ChartTooltip
              content={<ChartTooltipContent
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "Conversion Rate"]}
              />}
            />
            <Line
              type="monotone"
              dataKey="conversionRate"
              stroke={chartConfig.conversionRate.color}
              strokeWidth={3}
              dot={{ fill: chartConfig.conversionRate.color, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface RolePerformanceChartProps {
  data: {
    admin: { sent: number; accepted: number; rate: number };
    manager: { sent: number; accepted: number; rate: number };
    user: { sent: number; accepted: number; rate: number };
  };
  className?: string;
}

export function RolePerformanceChart({ data, className }: RolePerformanceChartProps) {
  const chartConfig = {
    sent: {
      label: "Sent",
      color: "hsl(var(--chart-1))",
    },
    accepted: {
      label: "Accepted",
      color: "hsl(var(--chart-2))",
    },
  };

  const roleData = [
    { role: "Admin", sent: data.admin.sent, accepted: data.admin.accepted, rate: data.admin.rate },
    { role: "Manager", sent: data.manager.sent, accepted: data.manager.accepted, rate: data.manager.rate },
    { role: "User", sent: data.user.sent, accepted: data.user.accepted, rate: data.user.rate },
  ];

  return (
    <Card className={className}>
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
        <ChartContainer config={chartConfig} className="h-64">
          <BarChart data={roleData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="role" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="sent" fill={chartConfig.sent.color} name="Sent" />
            <Bar dataKey="accepted" fill={chartConfig.accepted.color} name="Accepted" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface InvitationStatusChartProps {
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  expiredInvitations: number;
  cancelledInvitations: number;
  className?: string;
}

export function InvitationStatusChart({
  totalInvitations,
  pendingInvitations,
  acceptedInvitations,
  expiredInvitations,
  cancelledInvitations,
  className
}: InvitationStatusChartProps) {
  const chartConfig = {
    pending: {
      label: "Pending",
      color: "hsl(var(--chart-3))",
    },
    accepted: {
      label: "Accepted",
      color: "hsl(var(--chart-2))",
    },
    expired: {
      label: "Expired",
      color: "hsl(var(--chart-4))",
    },
    cancelled: {
      label: "Cancelled",
      color: "hsl(var(--chart-5))",
    },
  };

  const pieData = [
    { name: "Pending", value: pendingInvitations, color: chartConfig.pending.color },
    { name: "Accepted", value: acceptedInvitations, color: chartConfig.accepted.color },
    { name: "Expired", value: expiredInvitations, color: chartConfig.expired.color },
    { name: "Cancelled", value: cancelledInvitations, color: chartConfig.cancelled.color },
  ].filter(item => item.value > 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invitation Status Distribution
        </CardTitle>
        <CardDescription>
          Current status breakdown of all invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface ResponseTimeChartProps {
  data: Array<{
    date: string;
    averageResponseTime: number;
  }>;
  className?: string;
}

export function ResponseTimeChart({ data, className }: ResponseTimeChartProps) {
  const chartConfig = {
    averageResponseTime: {
      label: "Avg Response Time (hours)",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Response Time Trends
        </CardTitle>
        <CardDescription>
          Average time for users to accept invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tickFormatter={(value) => `${value}h`} />
            <ChartTooltip
              content={<ChartTooltipContent
                formatter={(value) => [`${Number(value).toFixed(1)}h`, "Avg Response Time"]}
              />}
            />
            <Line
              type="monotone"
              dataKey="averageResponseTime"
              stroke={chartConfig.averageResponseTime.color}
              strokeWidth={2}
              dot={{ fill: chartConfig.averageResponseTime.color, strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}