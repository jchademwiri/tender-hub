"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Search,
  Users,
  UserCheck,
  UserX,
  Crown,
  Shield,
  User,
  CheckSquare,
  Square,
  Download,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmDialog } from "./ConfirmDialog";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "user";
  status: "active" | "suspended" | "pending";
  invitedBy?: string | null;
  invitedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date | null;
}

interface TeamMemberTableProps {
  members?: TeamMember[]; // Made optional since we'll fetch data internally
  isLoading?: boolean;
  onInviteMember?: () => void;
  onEditMember?: (member: TeamMember) => void;
  onSuspendMember?: (member: TeamMember) => void;
  onActivateMember?: (member: TeamMember) => void;
  onDeleteMember?: (member: TeamMember) => void;
  canInvite?: boolean;
  canEdit?: boolean;
  canSuspend?: boolean;
  canDelete?: boolean;
  showAnalytics?: boolean;
  enablePolling?: boolean; // New prop to enable/disable polling
  onOptimisticUpdate?: (memberId: string, data: Partial<TeamMember>) => void; // Callback for optimistic updates
  onOptimisticDelete?: (memberId: string) => void; // Callback for optimistic deletes
  showExport?: boolean; // New prop to show export options
}

export function TeamMemberTable({
  members: propMembers,
  isLoading = false,
  onInviteMember,
  onEditMember,
  onSuspendMember,
  onActivateMember,
  onDeleteMember,
  canInvite = false,
  canEdit = false,
  canSuspend = false,
  canDelete = false,
  showAnalytics = false,
  enablePolling = true,
  onOptimisticUpdate,
  onOptimisticDelete,
  showExport = false,
}: TeamMemberTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(),
  );
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    action: "suspend" | "activate" | "delete" | null;
    memberIds: string[];
    isLoading: boolean;
    progress: { current: number; total: number } | null;
  }>({
    open: false,
    action: null,
    memberIds: [],
    isLoading: false,
    progress: null,
  });

  const [exportDialog, setExportDialog] = useState<{
    open: boolean;
    format: "csv" | "json" | "pdf";
    isLoading: boolean;
  }>({ open: false, format: "csv", isLoading: false });

  const queryClient = useQueryClient();

  // Fetch team members with polling
  const {
    data: queryData,
    isLoading: isQueryLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const response = await fetch("/api/team");
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      const data = await response.json();
      return data.members || [];
    },
    refetchInterval: enablePolling ? 30000 : false, // Poll every 30 seconds if enabled
    refetchIntervalInBackground: false,
    staleTime: 10000, // Consider data stale after 10 seconds
    enabled: enablePolling, // Only run if polling is enabled
  });

  // Use prop members if provided, otherwise use query data
  const members = propMembers || queryData || [];
  const isLoadingState = isLoading || (enablePolling && isQueryLoading);

  // Mutations for optimistic updates
  const updateMemberMutation = useMutation({
    mutationFn: async ({
      memberId,
      data,
    }: {
      memberId: string;
      data: {
        name?: string;
        role?: TeamMember["role"];
        status?: TeamMember["status"];
      };
    }) => {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update member");
      }
      return response.json();
    },
    onMutate: async ({ memberId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["team-members"] });

      // Snapshot previous value
      const previousMembers = queryClient.getQueryData<TeamMember[]>([
        "team-members",
      ]);

      // Optimistically update
      queryClient.setQueryData<TeamMember[]>(["team-members"], (old) => {
        if (!old) return old;
        return old.map((member) =>
          member.id === memberId
            ? ({ ...member, ...data, updatedAt: new Date() } as TeamMember)
            : member,
        );
      });

      return { previousMembers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        queryClient.setQueryData(["team-members"], context.previousMembers);
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to update member",
      );
    },
    onSuccess: (data, variables) => {
      toast.success("Member updated successfully");
      // Call optimistic update callback if provided
      if (onOptimisticUpdate) {
        onOptimisticUpdate(variables.memberId, variables.data);
      }
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete member");
      }
      return response.json();
    },
    onMutate: async (memberId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["team-members"] });

      // Snapshot previous value
      const previousMembers = queryClient.getQueryData<TeamMember[]>([
        "team-members",
      ]);

      // Optimistically remove
      queryClient.setQueryData<TeamMember[]>(["team-members"], (old) => {
        if (!old) return old;
        return old.filter((member) => member.id !== memberId);
      });

      return { previousMembers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        queryClient.setQueryData(["team-members"], context.previousMembers);
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to delete member",
      );
    },
    onSuccess: (data, memberId) => {
      toast.success("Member deleted successfully");
      // Call optimistic delete callback if provided
      if (onOptimisticDelete) {
        onOptimisticDelete(memberId);
      }
    },
  });

  // Handle selection logic
  const handleSelectMember = (memberId: string, checked: boolean) => {
    const newSelected = new Set(selectedMembers);
    if (checked) {
      newSelected.add(memberId);
    } else {
      newSelected.delete(memberId);
    }
    setSelectedMembers(newSelected);
    setSelectAll(
      newSelected.size === filteredAndSortedMembers.length &&
        filteredAndSortedMembers.length > 0,
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(
        new Set(filteredAndSortedMembers.map((m: TeamMember) => m.id)),
      );
    } else {
      setSelectedMembers(new Set());
    }
    setSelectAll(checked);
  };

  // Clear selection when filters change
  useMemo(() => {
    setSelectedMembers(new Set());
    setSelectAll(false);
  }, [searchTerm, statusFilter, roleFilter]);

  // Bulk action handler
  const handleBulkAction = (action: "suspend" | "activate" | "delete") => {
    const memberIds = Array.from(selectedMembers);
    setBulkActionDialog({
      open: true,
      action,
      memberIds,
      isLoading: false,
      progress: null,
    });
  };

  // Execute bulk action
  const executeBulkAction = async () => {
    if (!bulkActionDialog.action || bulkActionDialog.memberIds.length === 0)
      return;

    const { action, memberIds } = bulkActionDialog;

    // Set loading state
    setBulkActionDialog((prev) => ({
      ...prev,
      isLoading: true,
      progress: { current: 0, total: memberIds.length },
    }));

    try {
      // Use bulk API endpoint
      const response = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, memberIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Bulk operation failed");
      }

      const result = await response.json();

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["team-members"] });

      setSelectedMembers(new Set());
      setSelectAll(false);

      if (result.errors && result.errors.length > 0) {
        toast.warning(
          `Partially successful: ${result.summary.successful} succeeded, ${result.summary.failed} failed`,
        );
      } else {
        toast.success(
          `Successfully ${action}d ${memberIds.length} member${memberIds.length !== 1 ? "s" : ""}`,
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${action} members. Please try again.`,
      );
    } finally {
      setBulkActionDialog({
        open: false,
        action: null,
        memberIds: [],
        isLoading: false,
        progress: null,
      });
    }
  };

  // Export team members
  const handleExportMembers = async (format: "csv" | "json" | "pdf") => {
    setExportDialog({ open: true, format, isLoading: true });

    try {
      const response = await fetch("/api/team/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `team-members-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Team members exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export team members. Please try again.");
    } finally {
      setExportDialog({ open: false, format: "csv", isLoading: false });
    }
  };

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    if (!members || members.length === 0) return [];

    let filtered = members.filter((member: TeamMember) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;
      const matchesRole = roleFilter === "all" || member.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });

    // Sort members
    filtered.sort((a: TeamMember, b: TeamMember) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "role":
          aValue = a.role;
          bValue = b.role;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [members, searchTerm, statusFilter, roleFilter, sortBy, sortOrder]);

  // Analytics
  const analytics = useMemo(() => {
    if (!members || members.length === 0) {
      return {
        total: 0,
        active: 0,
        suspended: 0,
        pending: 0,
        roleBreakdown: { owner: 0, admin: 0, manager: 0, user: 0 },
      };
    }

    const total = members.length;
    const active = members.filter(
      (m: TeamMember) => m.status === "active",
    ).length;
    const suspended = members.filter(
      (m: TeamMember) => m.status === "suspended",
    ).length;
    const pending = members.filter(
      (m: TeamMember) => m.status === "pending",
    ).length;

    const roleBreakdown = {
      owner: members.filter((m: TeamMember) => m.role === "owner").length,
      admin: members.filter((m: TeamMember) => m.role === "admin").length,
      manager: members.filter((m: TeamMember) => m.role === "manager").length,
      user: members.filter((m: TeamMember) => m.role === "user").length,
    };

    return { total, active, suspended, pending, roleBreakdown };
  }, [members]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-red-500" />;
      case "manager":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: "bg-yellow-100 text-yellow-800",
      admin: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      user: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge
        variant="outline"
        className={colors[role as keyof typeof colors] || colors.user}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="border rounded-lg">
          <div className="h-12 bg-gray-100 border-b"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-50 border-b animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {showAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.active}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {analytics.suspended}
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
                {analytics.pending}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {showExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Team Members</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExportMembers("csv")}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportMembers("json")}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportMembers("pdf")}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {canInvite && onInviteMember && (
            <Button onClick={onInviteMember}>
              <Users className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedMembers.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedMembers.size} member{selectedMembers.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex gap-2 ml-auto">
            {canSuspend && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("suspend")}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Suspend Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("activate")}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate Selected
                </Button>
              </>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction("delete")}
              >
                <UserX className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all members"
                />
              </TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  No team members found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedMembers.map((member: TeamMember) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.has(member.id)}
                      onCheckedChange={(checked) =>
                        handleSelectMember(member.id, checked as boolean)
                      }
                      aria-label={`Select ${member.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={member.name} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(member.role)}
                      {getRoleBadge(member.role)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(member.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {member.lastLogin
                      ? format(new Date(member.lastLogin), "MMM dd, yyyy")
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {canEdit && onEditMember && (
                          <DropdownMenuItem
                            onClick={() => onEditMember(member)}
                          >
                            Edit Member
                          </DropdownMenuItem>
                        )}
                        {canSuspend && member.status === "active" && (
                          <DropdownMenuItem
                            onClick={() => {
                              updateMemberMutation.mutate({
                                memberId: member.id,
                                data: { status: "suspended" },
                              });
                            }}
                            className="text-orange-600"
                          >
                            Suspend Member
                          </DropdownMenuItem>
                        )}
                        {canSuspend && member.status === "suspended" && (
                          <DropdownMenuItem
                            onClick={() => {
                              updateMemberMutation.mutate({
                                memberId: member.id,
                                data: { status: "active" },
                              });
                            }}
                            className="text-green-600"
                          >
                            Activate Member
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                deleteMemberMutation.mutate(member.id);
                              }}
                              className="text-red-600"
                            >
                              Delete Member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Action Confirmation Dialog */}
      <ConfirmDialog
        open={bulkActionDialog.open}
        onOpenChange={(open: boolean) =>
          setBulkActionDialog((prev) => ({ ...prev, open }))
        }
        title={`Confirm Bulk ${bulkActionDialog.action?.charAt(0).toUpperCase()}${bulkActionDialog.action?.slice(1)}`}
        description={`Are you sure you want to ${bulkActionDialog.action} ${bulkActionDialog.memberIds.length} member${bulkActionDialog.memberIds.length !== 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText={`${bulkActionDialog.action?.charAt(0).toUpperCase()}${bulkActionDialog.action?.slice(1)} ${bulkActionDialog.memberIds.length} Member${bulkActionDialog.memberIds.length !== 1 ? "s" : ""}`}
        cancelText="Cancel"
        onConfirm={executeBulkAction}
        variant={
          bulkActionDialog.action === "delete" ? "destructive" : "default"
        }
        isLoading={bulkActionDialog.isLoading}
        progress={bulkActionDialog.progress || undefined}
      />

      {/* Results Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredAndSortedMembers.length} of {members?.length || 0}{" "}
        members
        {enablePolling && (
          <span className="ml-2 text-xs text-blue-600">
            • Auto-refreshing every 30 seconds
          </span>
        )}
      </div>
    </div>
  );
}
