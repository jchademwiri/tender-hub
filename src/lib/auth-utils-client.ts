import type { User } from "@/db/schema";

/**
 * Client-side user state (populated by server components)
 */
let currentUser: User | null = null;

/**
 * Set current user (called by server components)
 */
export function setCurrentUser(user: User | null) {
  currentUser = user;
}

/**
 * Get the current user (Client-side)
 */
export function getCurrentUser(): User | null {
  return currentUser;
}

/**
 * Check if user is authenticated (Client-side)
 */
export function isAuthenticated(): boolean {
  return !!currentUser;
}

/**
 * Check if user has a specific role (Client-side)
 */
export function hasRole(role: string): boolean {
  return currentUser?.role === role;
}

/**
 * Check if user has any of the specified roles (Client-side)
 */
export function hasAnyRole(roles: string[]): boolean {
  return currentUser?.role ? roles.includes(currentUser.role) : false;
}

/**
 * Check if user is admin (admin or owner role) (Client-side)
 */
export function isAdmin(): boolean {
  return hasAnyRole(["admin", "owner"]);
}

/**
 * Check if user is owner (Client-side)
 */
export function isOwner(): boolean {
  return hasRole("owner");
}

/**
 * Get user initials for avatar (Client-side)
 */
export function getUserInitials(user: User | null): string {
  if (!user?.name) return "U";

  return user.name
    .split(" ")
    .map((name) => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Format user role for display (Client-side)
 */
export function formatUserRole(role: string | null): string {
  if (!role) return "User";

  const roleMap: Record<string, string> = {
    owner: "Owner",
    admin: "Administrator",
    manager: "Manager",
    user: "User",
  };

  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Check if user can perform an action based on permissions (Client-side)
 */
export function canUser(action: string, resource?: string): boolean {
  if (!currentUser?.role) return false;

  // Define permissions based on roles
  const permissions: Record<string, string[]> = {
    owner: ["create", "read", "update", "delete", "manage"],
    admin: ["create", "read", "update", "delete"],
    manager: ["create", "read", "update"],
    user: ["read"],
  };

  const userPermissions = permissions[currentUser.role] || [];
  return userPermissions.includes(action);
}

/**
 * Get redirect URL based on user role (Client-side)
 */
export function getRoleBasedRedirectUrl(user: User | null): string {
  if (!user) return "/";

  return user.role === "admin" || user.role === "owner" ? "/admin" : "/dashboard";
}