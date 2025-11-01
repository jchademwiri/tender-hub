import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, BellOff, AlertTriangle, CheckCircle, XCircle, Clock, Settings } from "lucide-react";
import { ALERT_RULES } from "@/lib/sentry-alerting";
import { sentryConfig } from "@/lib/env-validation";

interface AlertStatus {
  id: string;
  rule: string;
  status: "active" | "resolved" | "muted";
  severity: "low" | "medium" | "high" | "critical";
  triggeredAt: string;
  resolvedAt?: string;
  description: string;
  affectedServices: string[];
}

export async function AlertsPanel() {
  const alertStatuses = await fetchAlertStatuses();
  const alertConfig = getAlertConfiguration();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 border-red-600 bg-red-50";
      case "high":
        return "text-orange-600 border-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 border-yellow-600 bg-yellow-50";
      case "low":
        return "text-blue-600 border-blue-600 bg-blue-50";
      default:
        return "text-gray-600 border-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "muted":
        return <BellOff className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const activeAlerts = alertStatuses.filter(alert => alert.status === "active");
  const resolvedAlerts = alertStatuses.filter(alert => alert.status === "resolved");

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Alert Overview */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Management
          </CardTitle>
          <CardDescription>
            System alerts, notifications, and monitoring rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {activeAlerts.length}
              </div>
              <div className="text-xs text-muted-foreground">Active Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {resolvedAlerts.length}
              </div>
              <div className="text-xs text-muted-foreground">Resolved Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {ALERT_RULES.length}
              </div>
              <div className="text-xs text-muted-foreground">Alert Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {alertConfig.channels.length}
              </div>
              <div className="text-xs text-muted-foreground">Notification Channels</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Alerts
          </CardTitle>
          <CardDescription>
            Alerts requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <Alert key={alert.id} className="border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(alert.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{alert.rule}</span>
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <AlertDescription className="text-xs">
                          {alert.description}
                        </AlertDescription>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {alert.triggeredAt}
                        </div>
                        {alert.affectedServices.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {alert.affectedServices.map((service) => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                      <Button variant="ghost" size="sm">
                        Mute
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active alerts</p>
              <p className="text-xs mt-1">All systems are operating normally</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Notification Channels</h4>
              <div className="space-y-2">
                {alertConfig.channels.map((channel) => (
                  <div key={channel.name} className="flex items-center justify-between">
                    <span className="text-sm">{channel.name}</span>
                    <Badge variant="outline" className={channel.enabled ? "text-green-600 border-green-600" : "text-gray-600 border-gray-600"}>
                      {channel.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Thresholds</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Error Threshold:</span>
                  <span className="font-medium">{alertConfig.thresholds.errors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Performance:</span>
                  <span className="font-medium">{alertConfig.thresholds.performance}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-medium">{alertConfig.thresholds.responseTime}ms</span>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full">
              Configure Alerts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert Rules */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Alert Rules</CardTitle>
          <CardDescription>
            Configured monitoring rules and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ALERT_RULES.map((rule, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={getSeverityColor(rule.severity)}>
                    {rule.severity.toUpperCase()}
                  </Badge>
                  <div>
                    <div className="font-medium text-sm">{rule.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Cooldown: {rule.cooldown} minutes | Channels: {rule.channels.join(", ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Active</Badge>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <CardDescription>
            Latest alert activity and resolutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resolvedAlerts.length > 0 ? (
            <div className="space-y-3">
              {resolvedAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-2 border rounded">
                  {getStatusIcon(alert.status)}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{alert.rule}</div>
                    <div className="text-xs text-muted-foreground">
                      Resolved {alert.resolvedAt}
                    </div>
                  </div>
                  <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No recent alert activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function fetchAlertStatuses(): Promise<AlertStatus[]> {
  // In a real implementation, this would fetch from your alerting system
  // For now, we'll return mock data
  return [
    // Mock active alert
    ...(Math.random() > 0.7 ? [{
      id: "alert-1",
      rule: "High Error Rate",
      status: "active" as const,
      severity: "high" as const,
      triggeredAt: "2 minutes ago",
      description: "Error rate has exceeded 5% threshold",
      affectedServices: ["API", "Database"],
    }] : []),
    
    // Mock resolved alerts
    {
      id: "alert-2",
      rule: "Database Connection Issues",
      status: "resolved" as const,
      severity: "medium" as const,
      triggeredAt: "1 hour ago",
      resolvedAt: "45 minutes ago",
      description: "Database connection pool exhausted",
      affectedServices: ["Database"],
    },
    {
      id: "alert-3",
      rule: "Performance Degradation",
      status: "resolved" as const,
      severity: "low" as const,
      triggeredAt: "3 hours ago",
      resolvedAt: "2 hours ago",
      description: "API response time exceeded threshold",
      affectedServices: ["API"],
    },
  ];
}

function getAlertConfiguration() {
  return {
    channels: [
      {
        name: "Email",
        enabled: sentryConfig.alerting.email !== undefined,
      },
      {
        name: "Webhook",
        enabled: sentryConfig.alerting.webhook !== undefined,
      },
      {
        name: "Sentry",
        enabled: sentryConfig.dsn !== undefined,
      },
    ],
    thresholds: {
      errors: sentryConfig.alerting.errorThreshold,
      performance: sentryConfig.alerting.performanceThreshold,
      responseTime: 500,
    },
  };
}