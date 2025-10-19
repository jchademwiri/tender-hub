import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import type { User } from "@/db/schema";

// ✅ Complete permission statements
export const statement = {
  ...defaultStatements, // Better Auth defaults

  // Application resources
  project: ["create", "read", "update", "delete", "share"],
  publisher: ["create", "read", "update", "delete", "publish", "suspend"],
  province: ["create", "read", "update", "delete"],
  analytics: ["view", "export", "delete"],
  invitation: ["create", "cancel", "resend"],
  profileUpdate: ["approve", "reject"],
} as const;

export const ac = createAccessControl(statement);

// ✅ User role - read-only
export const user = ac.newRole({
  project: ["read", "share"],
  publisher: ["read"],
  province: ["read"],
  analytics: ["view"], // Only own analytics
});

// ✅ Manager role - operational control
export const manager = ac.newRole({
  project: ["create", "read", "update", "share"],
  publisher: ["create", "read", "update", "suspend"], // Cannot delete
  province: ["read"],
  analytics: ["view", "export"], // Aggregate analytics only
  invitation: ["create", "resend"], // Can invite users only
  profileUpdate: ["approve", "reject"],
});

// ✅ Admin role - full control
export const admin = ac.newRole({
  ...adminAc.statements,
  project: ["create", "read", "update", "delete", "share"],
  publisher: ["create", "read", "update", "delete", "publish", "suspend"],
  province: ["create", "read", "update", "delete"],
  analytics: ["view", "export", "delete"],
  invitation: ["create", "cancel", "resend"],
  profileUpdate: ["approve", "reject"],
});

// ✅ Owner role (if using organization plugin)
export const owner = ac.newRole({
  ...adminAc.statements, // Use admin statements as base
  project: ["create", "read", "update", "delete", "share"],
  publisher: ["create", "read", "update", "delete", "publish", "suspend"],
  province: ["create", "read", "update", "delete"],
  analytics: ["view", "export", "delete"],
  invitation: ["create", "cancel", "resend"],
  profileUpdate: ["approve", "reject"],
});

// ✅ Permission checker utility
export class PermissionChecker {
  constructor(private user: User) {}

  hasRole(role: string): boolean {
    return this.user.role === role;
  }

  hasRoleOrHigher(role: string): boolean {
    const hierarchy: Record<string, number> = { admin: 3, manager: 2, user: 1 };
    return (hierarchy[this.user.role || "user"] || 0) >= (hierarchy[role] || 0);
  }

  // Invitation permissions
  canInviteUsers(): boolean {
    return this.hasRoleOrHigher("manager");
  }

  canInviteAdmin(): boolean {
    return this.hasRole("admin");
  }

  canInviteManager(): boolean {
    return this.hasRole("admin");
  }

  // User management permissions
  canModifyUser(targetUser: User): boolean {
    if (this.user.role === "admin") return true;
    if (this.user.role === "manager") {
      return targetUser.role === "user";
    }
    return this.user.id === targetUser.id;
  }

  canSuspendUser(targetUser: User): boolean {
    if (this.user.role === "admin") return true;
    if (this.user.role === "manager") {
      return targetUser.role === "user"; // Can only suspend users
    }
    return false;
  }

  canResetUserPassword(targetUser: User): boolean {
    if (this.user.role === "admin") return true;
    if (this.user.role === "manager") {
      return targetUser.role === "user";
    }
    return this.user.id === targetUser.id;
  }

  canDeleteUser(_targetUser: User): boolean {
    return this.user.role === "admin";
  }

  // Analytics permissions
  canViewUserAnalytics(targetUserId: string): boolean {
    if (this.user.role === "admin") return true;
    return this.user.id === targetUserId; // Users can view own analytics
  }

  canViewAggregateAnalytics(): boolean {
    return this.hasRoleOrHigher("manager");
  }

  // Profile update approval
  canApproveProfileUpdates(): boolean {
    return this.hasRoleOrHigher("manager");
  }
}

export function checkPermission(user: User) {
  return new PermissionChecker(user);
}
