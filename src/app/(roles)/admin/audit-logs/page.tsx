"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface AuditLog {
  id: string;
  action: string;
  targetUserId?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  metadata: any;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

export default function AuditLogsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const action = searchParams?.get("action") || "all";
  const days = parseInt(searchParams?.get("days") || "30", 10);
  const page = parseInt(searchParams?.get("page") || "1", 10);
  const pageSize = parseInt(searchParams?.get("pageSize") || "10", 10);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    startIndex: 0,
    endIndex: 0,
  });

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        action: action || "all",
        days: days.toString(),
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.auditLogs || []);
        setPagination(data.pagination || {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          startIndex: 0,
          endIndex: 0,
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("API Error:", response.status, errorData);
        
        if (response.status === 403) {
          setError("Access denied. Admin privileges required.");
          router.push("/sign-in?redirect=/admin/audit-logs");
        } else if (response.status === 401) {
          setError("Authentication required. Please sign in.");
          router.push("/sign-in?redirect=/admin/audit-logs");
        } else {
          setError("Failed to load audit logs. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setError("Failed to load audit logs. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [action, days, page, pageSize]);

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const updatePageSize = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("pageSize", newPageSize.toString());
    params.set("page", "1"); // Reset to first page when changing page size
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const current = pagination.page;
    const total = pagination.totalPages;
    const delta = 2; // Show 2 pages before and after current
    
    const pages: (number | string)[] = [];
    
    // Always show first page
    if (total <= 1) return pages;
    
    pages.push(1);
    
    // Add ellipsis after first page if needed
    if (current - delta > 2) {
      pages.push('...');
    }
    
    // Add pages around current
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (current + delta < total - 1) {
      pages.push('...');
    }
    
    // Always show last page
    if (total > 1) {
      pages.push(total);
    }
    
    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Monitor system activities and user actions
          </p>
        </div>
        {pagination.total > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {pagination.startIndex + 1}-{pagination.endIndex} of {pagination.total} logs
          </div>
        )}
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
          <CardDescription>System events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading audit logs...
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-sm mb-4">{error}</div>
              <Button
                onClick={fetchAuditLogs}
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {formatActionName(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatUserDisplay(log)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <Badge variant="secondary" className="text-xs">
                              {log.userRole || "User"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-xs">
                            {renderActionDetails(log.action, log.metadata)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(new Date(log.createdAt))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No audit logs found for the selected time range
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Items per page:</span>
                    <select
                      title="Items per page"
                      value={pageSize}
                      onChange={(e) => updatePageSize(parseInt(e.target.value, 10))}
                      className="h-8 w-[70px] rounded border border-input bg-background text-sm"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.hasPreviousPage) {
                              updatePage(pagination.page - 1);
                            }
                          }}
                          className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {generatePageNumbers().map((pageNum, index) => (
                        <PaginationItem key={index}>
                          {pageNum === "..." ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                updatePage(pageNum as number);
                              }}
                              isActive={pageNum === pagination.page}
                            >
                              {pageNum}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.hasNextPage) {
                              updatePage(pagination.page + 1);
                            }
                          }}
                          className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to format action names
function formatActionName(action: string): string {
  const actionMap: Record<string, string> = {
    team_members_viewed: "Team Viewed",
    team_member_updated: "Member Updated",
    team_member_created: "Member Created",
    team_member_deleted: "Member Deleted",
    sign_in_email: "Email Sign In",
    sign_out: "Sign Out",
    user_created: "User Created",
    user_updated: "User Updated",
    user_invited: "User Invited",
    user_activated: "User Activated",
    user_suspended: "User Suspended",
    role_changed: "Role Changed",
    permission_granted: "Permission Granted",
    system_backup: "Backup Completed",
    settings_updated: "Settings Updated",
  };

  return (
    actionMap[action] ||
    action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

// Helper function to format user display name
function formatUserDisplay(log: AuditLog): string {
  // If we have user name from API (when available)
  if (log.userName && log.userName.trim() !== "") {
    return log.userName;
  }

  // If it's anonymous
  if (log.userId === "anonymous") return "Anonymous";

  // If it's a UUID, show just the first 8 characters
  if (
    log.userId.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  ) {
    return `${log.userId.substring(0, 8)}...`;
  }

  return log.userId;
}

// Helper function to format target user
function _formatTargetUser(targetUserId?: string): string {
  if (!targetUserId) return "-";

  // If it's a UUID, show just the first 8 characters
  if (
    targetUserId.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  ) {
    return `${targetUserId.substring(0, 8)}...`;
  }

  return targetUserId;
}

// Helper function to render action-specific details
function renderActionDetails(action: string, metadata: any): string {
  if (!metadata) return "-";

  try {
    // Parse metadata if it's a string
    const meta = typeof metadata === "string" ? JSON.parse(metadata) : metadata;

    switch (action) {
      case "team_member_updated":
        if (meta.changes?.updatedAt) {
          return "Member details updated";
        }
        if (meta.changes?.role) {
          return `Role changed to ${meta.changes.role}`;
        }
        return "Member profile updated";

      case "sign_in_email":
        return meta.success ? "Successful sign in" : "Failed sign in";

      case "sign_out":
        return "User signed out";

      case "team_members_viewed":
        return "Viewed team member list";

      case "user_invited":
        if (meta.email) {
          return `Invitation sent to ${meta.email}`;
        }
        return "User invitation sent";

      case "role_changed":
        if (meta.role) {
          return `Role changed to ${meta.role}`;
        }
        return "User role updated";

      case "settings_updated":
        if (meta.setting) {
          return `${meta.setting} updated`;
        }
        return "System settings modified";

      default: {
        // Generic handling for other actions
        if (meta.success === false) {
          return "Action failed";
        }
        if (meta.success === true) {
          return "Action completed successfully";
        }

        // Extract common useful fields
        const details = [];
        if (meta.email) details.push(`Email: ${meta.email}`);
        if (meta.role) details.push(`Role: ${meta.role}`);
        if (meta.status) details.push(`Status: ${meta.status}`);

        return details.length > 0 ? details.join(", ") : "System activity";
      }
    }
  } catch (_error) {
    return "Activity logged";
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}
