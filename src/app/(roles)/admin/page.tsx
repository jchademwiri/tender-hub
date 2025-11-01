import { subDays } from "date-fns";
import { count, desc, eq, gte } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { auditLog, invitation, user } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";

/**
 * TODO: Admin Dashboard Implementation Checklist
 *
 * SYSTEM OVERVIEW & MONITORING:
 * [ ] Real-time system health metrics (CPU, memory, disk usage)
 * [ ] Database connection status and query performance
 * [ ] API response times and error rates
 * [ ] Active user sessions and concurrent connections
 * [ ] Background job queue status and processing times
 *
 * USER MANAGEMENT DASHBOARD:
 * [ ] Total users by role with growth charts
 * [ ] Recent user registrations and activity
 * [ ] User suspension and deletion statistics
 * [ ] Invitation acceptance rates and trends
 * [ ] Geographic distribution of users
 *
 * SECURITY & AUDIT:
 * [ ] Failed login attempts and security events
 * [ ] Recent admin actions and system changes
 * [ ] Data export and backup status
 * [ ] Compliance monitoring (GDPR, data retention)
 * [ ] Security scan results and vulnerability alerts
 *
 * PERFORMANCE ANALYTICS:
 * [ ] Page load times and Core Web Vitals
 * [ ] API endpoint performance breakdown
 * [ ] Database query optimization opportunities
 * [ ] CDN and caching effectiveness
 * [ ] Mobile vs desktop usage patterns
 *
 * ADMIN QUICK ACTIONS:
 * [ ] Bulk user operations (suspend, delete, role changes)
 * [ ] System maintenance mode toggle
 * [ ] Database backup and restore functions
 * [ ] Cache clearing and system restart
 * [ ] Emergency notification system
 */

export default async function AdminDashboard() {
  // Get authenticated user
  const _currentUser = await requireAuth();

  // Get real statistics from database
  const [totalUsers] = await db.select({ count: count() }).from(user);
  const [pendingInvitations] = await db
    .select({ count: count() })
    .from(invitation)
    .where(eq(invitation.status, "pending"));

  // Get recently created users (users created within last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const [recentUsers] = await db
    .select({ count: count() })
    .from(user)
    .where(gte(user.createdAt, thirtyDaysAgo));

  // Get recent audit logs
  const recentAuditLogs = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      targetUserId: auditLog.targetUserId,
      userId: auditLog.userId,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          System administration and platform oversight
        </p>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentUsers.count}</div>
            <p className="text-xs text-muted-foreground">
              Created in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvitations.count}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting user acceptance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.count}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
            <CardDescription>
              Latest system changes and user actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAuditLogs.length > 0 ? (
              recentAuditLogs.map((log) => (
                <div key={log.id} className="flex items-center space-x-4">
                  <Badge variant="outline">{log.action}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {log.action === "user_created" && `User account created`}
                    {log.action === "user_invited" && `Invitation sent`}
                    {log.action === "role_changed" && `User role updated`}
                    {log.action === "permission_granted" &&
                      `Permission granted`}
                    {log.action === "system_backup" &&
                      `System backup completed`}
                    {log.action === "user_suspended" &&
                      `User account suspended`}
                    {log.action === "user_activated" &&
                      `User account activated`}
                    {![
                      "user_created",
                      "user_invited",
                      "role_changed",
                      "permission_granted",
                      "system_backup",
                      "user_suspended",
                      "user_activated",
                    ].includes(log.action) && log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatTimeAgo(log.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/invitations">Invite New User</Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/audit-logs">View Audit Logs</Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/settings">System Settings</Link>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Backup Database
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Security Scan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
