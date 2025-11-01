// Type extensions for Better Auth
import type { User as BetterAuthUser } from "better-auth";

// Extend the Better Auth User type to include our custom fields
export interface User extends BetterAuthUser {
  role: "owner" | "admin" | "manager" | "user";
  status?: "active" | "suspended" | "pending";
  banned?: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
  invitedBy?: string | null;
  invitedAt?: Date | null;
}

// Session type with extended user
export interface Session {
  user: User;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    impersonatedBy?: string | null;
  };
}

// Auth context type
export interface AuthContext {
  user: User | null;
  session: Session["session"] | null;
}

// Form state types
export interface FormState {
  error?: string;
  success?: boolean;
  message?: string;
  redirectTo?: string;
}

// Role types
export type Role = "owner" | "admin" | "manager" | "user";
export type UserStatus = "active" | "suspended" | "pending";

// Permission types
export interface Permission {
  resource: string;
  action: string;
}

export interface RolePermissions {
  [role: string]: Permission[];
}
