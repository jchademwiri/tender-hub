"use client";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Table from "@/components/Table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

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

interface InvitationTableProps {
  invitations: Invitation[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAction: (action: string, invitationId: string) => void;
  onBulkAction?: (action: string, invitationIds: string[]) => void;
}

export function InvitationTable({
  invitations,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onAction,
  onBulkAction,
}: InvitationTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null);
  const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(
    new Set(),
  );
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(
    null,
  );
  const [showBulkCancelDialog, setShowBulkCancelDialog] = useState(false);

  // Handle invitation actions
  const handleAction = async (action: string, invitationId: string) => {
    if (action === "cancel") {
      setShowCancelDialog(invitationId);
      return;
    }

    setActionLoading(`${action}-${invitationId}`);
    try {
      await onAction(action, invitationId);
    } finally {
      setActionLoading(null);
    }
  };

  // Confirm cancel action
  const confirmCancel = async () => {
    if (!showCancelDialog) return;

    setActionLoading(`cancel-${showCancelDialog}`);
    try {
      await onAction("cancel", showCancelDialog);
      setShowCancelDialog(null);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle invitation selection
  const toggleInvitationSelection = (invitationId: string) => {
    const newSelection = new Set(selectedInvitations);
    if (newSelection.has(invitationId)) {
      newSelection.delete(invitationId);
    } else {
      newSelection.add(invitationId);
    }
    setSelectedInvitations(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedInvitations.size === invitations.length) {
      setSelectedInvitations(new Set());
    } else {
      setSelectedInvitations(new Set(invitations.map((inv) => inv.id)));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedInvitations.size === 0) {
      toast.error("Please select invitations to perform bulk actions");
      return;
    }

    if (action === "cancel") {
      setShowBulkCancelDialog(true);
      return;
    }

    setBulkActionLoading(action);
    try {
      await onBulkAction?.(action, Array.from(selectedInvitations));
      setSelectedInvitations(new Set());
    } finally {
      setBulkActionLoading(null);
    }
  };

  // Confirm bulk cancel action
  const confirmBulkCancel = async () => {
    setBulkActionLoading("cancel");
    try {
      await onBulkAction?.("cancel", Array.from(selectedInvitations));
      setSelectedInvitations(new Set());
      setShowBulkCancelDialog(false);
    } finally {
      setBulkActionLoading(null);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if invitation is expired
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
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

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "accepted":
        return <CheckCircle className="h-3 w-3" />;
      case "expired":
        return <AlertCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: "select" as keyof Invitation,
      header: onBulkAction ? (
        <Checkbox
          checked={
            selectedInvitations.size === invitations.length &&
            invitations.length > 0
          }
          onCheckedChange={toggleSelectAll}
        />
      ) : (
        "Select"
      ),
      render: (_value: any, invitation: Invitation) => (
        <Checkbox
          checked={selectedInvitations.has(invitation.id)}
          onCheckedChange={() => toggleInvitationSelection(invitation.id)}
        />
      ),
    },
    {
      key: "email" as keyof Invitation,
      header: "Email",
      render: (email: string) => <div className="font-medium">{email}</div>,
    },
    {
      key: "role" as keyof Invitation,
      header: "Role",
      render: (role: string) => (
        <Badge variant="outline" className="capitalize">
          {role}
        </Badge>
      ),
    },
    {
      key: "status" as keyof Invitation,
      header: "Status",
      render: (status: string) => (
        <Badge variant={getStatusVariant(status)} className="capitalize">
          {getStatusIcon(status)}
          <span className="ml-1">{status}</span>
        </Badge>
      ),
    },
    {
      key: "expiresAt" as keyof Invitation,
      header: "Expires",
      render: (expiresAt: string) => {
        const expired = isExpired(expiresAt);
        return (
          <div className={`text-sm ${expired ? "text-destructive" : ""}`}>
            {formatDate(expiresAt)}
          </div>
        );
      },
    },
    {
      key: "inviter" as keyof Invitation,
      header: "Invited By",
      render: (inviter: any) => (
        <div className="text-sm">
          {inviter ? inviter.name || inviter.email : "System"}
        </div>
      ),
    },
  ];

  // Actions for each invitation
  const renderActions = (invitation: Invitation) => {
    const isLoading =
      actionLoading === `resend-${invitation.id}` ||
      actionLoading === `cancel-${invitation.id}`;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleAction("view", invitation.id)}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>

          {invitation.status === "pending" &&
            !isExpired(invitation.expiresAt) && (
              <DropdownMenuItem
                onClick={() => handleAction("resend", invitation.id)}
                disabled={isLoading}
                className="cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Invitation
              </DropdownMenuItem>
            )}

          {invitation.status === "pending" &&
            !isExpired(invitation.expiresAt) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleAction("cancel", invitation.id)}
                  disabled={isLoading}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Invitation
                </DropdownMenuItem>
              </>
            )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>Loading invitations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>No invitations found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No invitations match your current filters.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invitations</CardTitle>
              <CardDescription>
                {invitations.length} invitation
                {invitations.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>

            {/* Bulk Actions */}
            {onBulkAction && selectedInvitations.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedInvitations.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("resend")}
                  disabled={bulkActionLoading !== null}
                >
                  {bulkActionLoading === "resend" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("cancel")}
                  disabled={bulkActionLoading !== null}
                >
                  {bulkActionLoading === "cancel" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <X className="mr-2 h-4 w-4" />
                  Cancel Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table data={invitations} columns={columns} actions={renderActions} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={!!showCancelDialog}
        onOpenChange={() => setShowCancelDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invitation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Cancel Confirmation Dialog */}
      <AlertDialog
        open={showBulkCancelDialog}
        onOpenChange={setShowBulkCancelDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Selected Invitations</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel {selectedInvitations.size}{" "}
              selected invitation{selectedInvitations.size !== 1 ? "s" : ""}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitations</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Invitations
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
