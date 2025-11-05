"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ActivityFeed } from "@/components/team/ActivityFeed";
import { ConfirmDialog } from "@/components/team/ConfirmDialog";
import { EditMemberDialog } from "@/components/team/EditMemberDialog";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { TeamAnalytics } from "@/components/team/TeamAnalytics";
import {
  type TeamMember,
  TeamMemberTable,
} from "@/components/team/TeamMemberTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkPermission } from "@/lib/permissions";

export default function AdminTeamManagement() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const queryClient = useQueryClient();

  // Mock current user - in real app this would come from auth context
  const currentUser = null; // Removed hardcoded mock user

  const userPermissions = currentUser ? checkPermission(currentUser) : {
    canInviteUsers: () => false,
    hasRole: (role: string) => false,
    hasRoleOrHigher: (role: string) => false,
    canInviteAdmin: () => false,
    canInviteManager: () => false,
    canDeleteUser: (user: any) => false,
  };

  // Handle optimistic updates from TeamMemberTable
  const handleOptimisticUpdate = useCallback(
    (memberId: string, data: Partial<TeamMember>) => {
      // The TeamMemberTable handles optimistic updates internally via React Query
      // We can add any additional logic here if needed
      console.log("Optimistic update:", memberId, data);
    },
    [],
  );

  const handleOptimisticDelete = useCallback((memberId: string) => {
    // The TeamMemberTable handles optimistic deletes internally via React Query
    // We can add any additional logic here if needed
    console.log("Optimistic delete:", memberId);
  }, []);

  // Invite member
  const handleInviteMember = async (data: {
    email: string;
    name: string;
    role: string;
  }) => {
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to invite member");
      }

      toast.success("Invitation sent successfully");
      // Invalidate and refetch team members to show the new pending member
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    } catch (error) {
      console.error("Error inviting member:", error);
      throw error;
    }
  };

  // Edit member
  const handleEditMember = async (
    memberId: string,
    data: { name: string; role?: string; status?: string },
  ) => {
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update member");
      }

      toast.success("Member updated successfully");
      // Invalidate and refetch team members
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    } catch (error) {
      console.error("Error updating member:", error);
      throw error;
    }
  };

  // Suspend member
  const handleSuspendMember = (member: TeamMember) => {
    setConfirmDialog({
      open: true,
      title: "Suspend Member",
      description: `Are you sure you want to suspend ${member.name}? They will lose access to the platform.`,
      onConfirm: async () => {
        try {
          await handleEditMember(member.id, {
            name: member.name,
            status: "suspended",
          });
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (_error) {
          // Error already handled in handleEditMember
        }
      },
      variant: "destructive",
    });
  };

  // Activate member
  const handleActivateMember = (member: TeamMember) => {
    setConfirmDialog({
      open: true,
      title: "Activate Member",
      description: `Are you sure you want to reactivate ${member.name}? They will regain access to the platform.`,
      onConfirm: async () => {
        try {
          await handleEditMember(member.id, {
            name: member.name,
            status: "active",
          });
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (_error) {
          // Error already handled in handleEditMember
        }
      },
    });
  };

  // Delete member
  const handleDeleteMember = (member: TeamMember) => {
    setConfirmDialog({
      open: true,
      title: "Delete Member",
      description: `Are you sure you want to permanently delete ${member.name}? This action cannot be undone.`,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/team/${member.id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete member");
          }

          toast.success("Member deleted successfully");
          // Invalidate and refetch team members
          queryClient.invalidateQueries({ queryKey: ["team-members"] });
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (error) {
          console.error("Error deleting member:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to delete member",
          );
        }
      },
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-gray-600">
          Manage your team members, permissions, and analytics
        </p>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <TeamMemberTable
            onInviteMember={() => setInviteDialogOpen(true)}
            onEditMember={(member) => {
              setSelectedMember(member);
              setEditDialogOpen(true);
            }}
            onSuspendMember={handleSuspendMember}
            onActivateMember={handleActivateMember}
            onDeleteMember={handleDeleteMember}
            canInvite={userPermissions.canInviteUsers()}
            canEdit={userPermissions.hasRole("admin")}
            canSuspend={userPermissions.hasRoleOrHigher("manager")}
            canDelete={currentUser ? userPermissions.canDeleteUser(currentUser) : false}
            showAnalytics={true}
            enablePolling={true}
            onOptimisticUpdate={handleOptimisticUpdate}
            onOptimisticDelete={handleOptimisticDelete}
            showExport={true}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <TeamAnalytics />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed maxItems={50} />
            </div>
            <div className="space-y-6">
              <TeamAnalytics className="lg:hidden" />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={handleInviteMember}
        canInviteAdmin={userPermissions.canInviteAdmin()}
        canInviteManager={userPermissions.canInviteManager()}
      />

      <EditMemberDialog
        member={selectedMember}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEditMember}
        canEditRole={userPermissions.hasRole("admin")}
        canEditStatus={userPermissions.hasRoleOrHigher("manager")}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
