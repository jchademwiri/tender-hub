"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  UserCheck,
  UserX,
  Users,
  Crown,
  Shield,
  User,
  Activity,
  RefreshCw,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityItem {
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
}

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function ActivityFeed({
  className,
  maxItems = 20,
  showHeader = true,
  compact = false,
}: ActivityFeedProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    data: activities,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["team-activity"],
    queryFn: async () => {
      const response = await fetch(
        "/api/team/analytics?period=30d&includeActivity=true",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch activity data");
      }
      const data = await response.json();
      return data.recentActivity as ActivityItem[];
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if enabled
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "member_joined":
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case "member_suspended":
        return <UserX className="h-4 w-4 text-red-500" />;
      case "member_activated":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case "member_deleted":
        return <UserX className="h-4 w-4 text-red-600" />;
      case "invitation_sent":
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadge = (type: ActivityItem["type"]) => {
    const variants = {
      member_joined: "default" as const,
      member_suspended: "destructive" as const,
      member_activated: "secondary" as const,
      member_deleted: "destructive" as const,
      invitation_sent: "outline" as const,
    };

    const labels = {
      member_joined: "Joined",
      member_suspended: "Suspended",
      member_activated: "Activated",
      member_deleted: "Deleted",
      invitation_sent: "Invited",
    };

    return (
      <Badge variant={variants[type]} className="text-xs">
        {labels[type]}
      </Badge>
    );
  };

  const displayedActivities = activities?.slice(0, maxItems) || [];

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={!autoRefresh}
              >
                <RefreshCw
                  className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <Clock
                  className={`h-4 w-4 ${autoRefresh ? "text-green-500" : "text-gray-400"}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className={compact ? "h-64" : "h-96"}>
          <div className="space-y-3">
            {displayedActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              displayedActivities.map((activity, index) => (
                <div key={activity.id}>
                  <div
                    className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                      compact ? "py-2" : ""
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getActivityBadge(activity.type)}
                        {!compact && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${compact ? "truncate" : ""}`}>
                        {activity.description}
                      </p>
                      {compact && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(
                            new Date(activity.timestamp),
                            "MMM dd, HH:mm",
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {index < displayedActivities.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {displayedActivities.length >= maxItems && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
