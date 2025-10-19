
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TeamMemberTable, type TeamMember } from "@/components/team/TeamMemberTable";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { EditMemberDialog } from "@/components/team/EditMemberDialog";
import { ConfirmDialog } from "@/components/team/ConfirmDialog";
import { checkPermission } from "@/lib/permissions";

export default function AdminTeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Mock current user - in real app this would come from auth context
  const currentUser = {
    id: "admin-1",
    name: "Admin User",
    email: "admin@example.com",
    emailVerified: true,
    image: null,
    role: "admin" as const,
    banned: null,
    banReason: null,
    banExpires: null,
    status: "active" as const,
    invitedBy: null,
    invitedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const userPermissions = checkPermission(currentUser);

  // Fetch team members
  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/team");
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Invite member
  const handleInviteMember = async (data: { email: string; name: string; role: string }) => {
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
      fetchMembers(); // Refresh the list
    } catch (error) {
      console.error("Error inviting member:", error);
      throw error;
    }
  };

  // Edit member
  const handleEditMember = async (memberId: string, data: { name: string; role?: string; status?: string }) => {
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
      fetchMembers(); // Refresh the list
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
          await handleEditMember(member.id, { name: member.name, status: "suspended" });
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (error) {
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
          await handleEditMember(member.id, { name: member.name, status: "active" });
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (error) {
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
          fetchMembers(); // Refresh the list
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (error) {
          console.error("Error deleting member:", error);
          toast.error(error instanceof Error ? error.message : "Failed to delete member");
        }
      },
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-gray-600">Manage your team members and their permissions</p>
      </div>

      <TeamMemberTable
        members={members}
        isLoading={isLoading}
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
        canDelete={userPermissions.canDeleteUser(currentUser)}
        showAnalytics={true}
      />

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
