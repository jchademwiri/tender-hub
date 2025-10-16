import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/db/schema";

/**
 * Get the current session from headers
 */
export async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Get the current user from session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role ? roles.includes(user.role) : false;
}

/**
 * Check if user is admin (admin or owner role)
 */
export async function isAdmin(): Promise<boolean> {
  return hasAnyRole(["admin", "owner"]);
}

/**
 * Check if user is owner
 */
export async function isOwner(): Promise<boolean> {
  return hasRole("owner");
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(redirectTo?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const redirectPath = redirectTo ? `/?redirect=${encodeURIComponent(redirectTo)}` : "/";
    redirect(redirectPath);
  }

  return user!;
}

/**
 * Require admin role - redirect to dashboard if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth();

  if (!isAdmin()) {
    redirect("/dashboard");
  }

  return user;
}

/**
 * Require specific role - redirect to dashboard if not authorized
 */
export async function requireRole(role: string) {
  const user = await requireAuth();

  if (user.role !== role) {
    redirect("/dashboard");
  }

  return user;
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(roles: string[]) {
  const user = await requireAuth();

  if (!roles.includes(user.role || "")) {
    redirect("/dashboard");
  }

  return user;
}

/**
 * Get user initials for avatar
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
 * Format user role for display
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
 * Check if user can perform an action based on permissions
 */
export async function canUser(action: string, resource?: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user?.role) return false;

  // Define permissions based on roles
  const permissions: Record<string, string[]> = {
    owner: ["create", "read", "update", "delete", "manage"],
    admin: ["create", "read", "update", "delete"],
    manager: ["create", "read", "update"],
    user: ["read"],
  };

  const userPermissions = permissions[user.role] || [];
  return userPermissions.includes(action);
}

/**
 * Get redirect URL based on user role
 */
export function getRoleBasedRedirectUrl(user: User | null): string {
  if (!user) return "/";

  return user.role === "admin" || user.role === "owner" ? "/admin" : "/dashboard";
}