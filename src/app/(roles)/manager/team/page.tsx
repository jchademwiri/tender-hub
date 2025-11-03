"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/team/ConfirmDialog";
import { EditMemberDialog } from "@/components/team/EditMemberDialog";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import {
  type TeamMember,
  TeamMemberTable,
} from "@/components/team/TeamMemberTable";
import { checkPermission } from "@/lib/permissions";

export default function ManagerTeamManagement() {
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
  const currentUser = {
    id: "manager-1",
    name: "Manager User",
    email: "manager@example.com",
    emailVerified: true,
    image: null,
    role: "manager" as const,
    banned: null,
    banReason: null,
    banExpires: null,
    status: "active" as const,
    invitedBy: null,
    invitedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    password: null, // Added missing password property
  };

  const userPermissions = checkPermission(currentUser);

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

  // Invite member (managers can only invite users)
  const handleInviteMember = async (data: {
    email: string;
    name: string;
    role: string;
  }) => {
    // Force role to "user" for managers
    const inviteData = { ...data, role: "user" };

    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inviteData),
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

  // Edit member (managers can only edit users)
  const handleEditMember = async (
    memberId: string,
    data: { name: string; role?: string; status?: string },
  ) => {
    // Remove role from data if present (managers can't change roles)
    const { role, ...updateData } = data;

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-gray-600">Manage your team members</p>
      </div>

      <TeamMemberTable
        onInviteMember={() => setInviteDialogOpen(true)}
        onEditMember={(member) => {
          setSelectedMember(member);
          setEditDialogOpen(true);
        }}
        onSuspendMember={handleSuspendMember}
        onActivateMember={handleActivateMember}
        canInvite={userPermissions.canInviteUsers()}
        canEdit={false} // Managers cannot edit roles
        canSuspend={userPermissions.hasRoleOrHigher("manager")}
        canDelete={false} // Managers cannot delete users
        showAnalytics={false} // Managers don't see analytics
        enablePolling={true}
        onOptimisticUpdate={handleOptimisticUpdate}
        onOptimisticDelete={handleOptimisticDelete}
      />

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={handleInviteMember}
        canInviteAdmin={false} // Managers cannot invite admins
        canInviteManager={false} // Managers cannot invite managers
      />

      <EditMemberDialog
        member={selectedMember}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEditMember}
        canEditRole={false} // Managers cannot edit roles
        canEditStatus={userPermissions.hasRoleOrHigher("manager")}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
