"use client";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface AuditLog {
  id: string;
  action: string;
  targetUserId?: string;
  userId: string;
  metadata: any;
  createdAt: string;
}

export default function AuditLogsPage() {
  const searchParams = useSearchParams();
  const action = searchParams?.get("action") || "all";
  const days = parseInt(searchParams?.get("days") || "30");

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [action, days]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: action || "all",
        days: days.toString(),
      });
      
      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">
          Monitor system activities and user actions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Filters</CardTitle>
          <CardDescription>Filter audit logs by time range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/admin/audit-logs?action=all&days=1">
              <Button variant="outline" className="w-full justify-start">
                Last 24 hours
              </Button>
            </Link>
            <Link href="/admin/audit-logs?action=all&days=7">
              <Button variant="outline" className="w-full justify-start">
                Last 7 days
              </Button>
            </Link>
            <Link href="/admin/audit-logs?action=all&days=30">
              <Button variant="outline" className="w-full justify-start">
                Last 30 days
              </Button>
            </Link>
            <Link href="/admin/audit-logs?action=all&days=90">
              <Button variant="outline" className="w-full justify-start">
                Last 90 days
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            System events and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading audit logs...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">{log.userId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.targetUserId || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {renderMetadataDetails(log.metadata)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatTimeAgo(new Date(log.createdAt))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No audit logs found for the selected time range
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to render metadata details
function renderMetadataDetails(metadata: any): string {
  if (!metadata) return "-";

  try {
    if (typeof metadata === "object") {
      const details = [];
      if (metadata.role) details.push(`Role: ${metadata.role}`);
      if (metadata.status) details.push(`Status: ${metadata.status}`);
      if (metadata.email) details.push(`Email: ${metadata.email}`);
      return details.join(", ") || JSON.stringify(metadata).substring(0, 50) + "...";
    }
    return String(metadata);
  } catch (error) {
    return "Invalid metadata";
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}