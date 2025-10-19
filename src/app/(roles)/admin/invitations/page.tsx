"use client";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Mail,
  Plus,
  Search,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { BulkCreateInvitationDialog } from "@/app/(roles)/admin/invitations/components/bulk-create-invitation-dialog";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { InvitationAnalyticsDashboard } from "@/app/(roles)/admin/invitations/components/invitation-analytics-dashboard";
import { invitationValidationHelpers } from "@/lib/validations/invitations";
import { InvitationTable } from "@/app/(roles)/admin/invitations/components/invitation-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}

interface InvitationResponse {
  invitations: Invitation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    status?: string;
    role?: string;
    search?: string;
  };
}

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    expired: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Fetch invitations data
  const fetchInvitations = useCallback(async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...filters,
      });

      const response = await fetch(`/api/admin/invitations?${params}`);
      if (!response.ok) {
        let errorMessage = "Failed to fetch invitations";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
      }

      let data: InvitationResponse;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error("Invalid response format from server");
      }
      setInvitations(data.invitations);
      setTotalPages(data.pagination.pages);
      setCurrentPage(data.pagination.page);

      // Calculate stats from the data
      const newStats: InvitationStats = {
        total: data.pagination.total,
        pending: data.invitations.filter((inv) => inv.status === "pending")
          .length,
        accepted: data.invitations.filter((inv) => inv.status === "accepted")
          .length,
        expired: data.invitations.filter((inv) => inv.status === "expired")
          .length,
        cancelled: data.invitations.filter((inv) => inv.status === "cancelled")
          .length,
      };
      setStats(newStats);
    } catch (error) {
      console.error("Error fetching invitations:", error);

      // Handle authentication errors gracefully
      if (
        error instanceof Error &&
        error.message.includes("Authentication required")
      ) {
        setIsAuthenticated(false);
        toast.error("Please log in to access invitation management", {
          description: "You need admin privileges to manage invitations.",
        });
      } else {
        toast.error("Failed to load invitations");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // Handle search and filters
  const handleSearch = () => {
    const filters: any = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter) filters.status = statusFilter;
    if (roleFilter) filters.role = roleFilter;

    setCurrentPage(1);
    fetchInvitations(1, filters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    const filters: any = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter) filters.status = statusFilter;
    if (roleFilter) filters.role = roleFilter;

    fetchInvitations(page, filters);
  };

  // Handle invitation actions
  const handleInvitationAction = async (
    action: string,
    invitationId: string,
  ) => {
    try {
      let response: Response;
      if (action === "resend") {
        response = await fetch(
          `/api/admin/invitations/${invitationId}/resend`,
          {
            method: "POST",
            credentials: "include",
          },
        );
      } else if (action === "cancel") {
        response = await fetch(
          `/api/admin/invitations/${invitationId}/cancel`,
          {
            method: "POST",
            credentials: "include",
          },
        );
      } else {
        return;
      }

      if (!response.ok) {
        let errorMessage = `Failed to ${action} invitation`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
      }

      toast.success(`Invitation ${action}ed successfully`);
      // Refresh the list
      handleSearch();
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);

      // Handle authentication errors gracefully
      if (
        error instanceof Error &&
        error.message.includes("Authentication required")
      ) {
        toast.error("Authentication required", {
          description: "Please log in to manage invitations.",
        });
      } else {
        toast.error(`Failed to ${action} invitation`);
      }
    }
  };

  // Handle invite member for single invitations
  const handleInviteMember = async (data: { email: string; name: string; role: "admin" | "manager" | "user" }) => {
    try {
      setIsInviting(true);

      // Validate using the schema
      const validationResult = invitationValidationHelpers.safeValidateCreateInvitation({
        email: data.email,
        name: data.name,
        role: data.role,
        sendEmail: true,
      });

      if (!validationResult.success) {
        console.error("❌ Validation failed:", validationResult.error.issues);
        const newErrors: Record<string, string> = {};
        validationResult.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        throw new Error(Object.values(newErrors)[0] || "Validation failed");
      }

      // Submit the invitation
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(validationResult.data),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: "Invalid response from server" };
        }

        if (response.status === 409) {
          throw new Error(errorData.error || "User with this email already exists");
        }

        if (response.status === 429) {
          throw new Error(errorData.error || "Daily invitation limit reached");
        }

        throw new Error(errorData.error || "Failed to create invitation");
      }

      toast.success("Invitation created successfully!");
      handleSearch(); // Refresh the list
    } catch (error) {
      console.error("Error creating invitation:", error);
      throw error;
    } finally {
      setIsInviting(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, invitationIds: string[]) => {
    try {
      let response: Response;
      let endpoint = "";

      if (action === "resend") {
        endpoint = "/api/admin/invitations/bulk-resend";
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invitationIds }),
        });
      } else if (action === "cancel") {
        endpoint = "/api/admin/invitations/bulk-cancel";
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invitationIds }),
        });
      } else {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} invitations`);
      }

      const result = await response.json();
      toast.success(
        `${result.successCount || invitationIds.length} invitation${(result.successCount || invitationIds.length) !== 1 ? "s" : ""} ${action}ed successfully`,
      );

      if (result.failedCount && result.failedCount > 0) {
        toast.error(
          `${result.failedCount} invitation${result.failedCount !== 1 ? "s" : ""} failed to ${action}`,
        );
      }

      // Refresh the list
      handleSearch();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);

      // Handle authentication errors gracefully
      if (
        error instanceof Error &&
        error.message.includes("Authentication required")
      ) {
        toast.error("Authentication required", {
          description: "Please log in to manage invitations.",
        });
      } else {
        toast.error(`Failed to ${action} invitations`);
      }
    }
  };

  const _getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
        return <AlertCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const _getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "accepted":
        return "secondary";
      case "expired":
        return "destructive";
      case "cancelled":
        return "outline";
      default:
        return "default";
    }
  };

  // Show authentication required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invitation Management
            </h1>
            <p className="text-muted-foreground">
              Manage user invitations, track status, and analyze performance
            </p>
          </div>
        </div>
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">
              Authentication Required
            </CardTitle>
            <CardDescription>
              You need to be logged in as an administrator to access invitation
              management features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact your system administrator or log in with
              appropriate credentials to continue.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Invitation Management
          </h1>
          <p className="text-muted-foreground">
            Manage user invitations, track status, and analyze performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkCreateDialog(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Bulk Create
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invitation
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Invitations
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.accepted}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expired}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cancelled}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>
                Filter invitations by status, role, or search by email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or inviter name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-statuses">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-roles">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleSearch} variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Invitations Table */}
          <InvitationTable
            invitations={invitations}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onAction={handleInvitationAction}
            onBulkAction={handleBulkAction}
          />

          {/* Create Invitation Dialog */}
          <InviteMemberDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onInvite={handleInviteMember}
            isInviting={isInviting}
            canInviteAdmin={true}
            canInviteManager={true}
          />

          {/* Bulk Create Invitation Dialog */}
          <BulkCreateInvitationDialog
            open={showBulkCreateDialog}
            onOpenChange={setShowBulkCreateDialog}
            onSuccess={() => {
              setShowBulkCreateDialog(false);
              handleSearch(); // Refresh the list
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <InvitationAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
