// Module declaration to extend Better Auth types
declare module "better-auth" {
  interface User {
    role: "owner" | "admin" | "manager" | "user";
    status?: "active" | "suspended" | "pending";
    banned?: boolean;
    banReason?: string | null;
    banExpires?: Date | null;
    invitedBy?: string | null;
    invitedAt?: Date | null;
  }
}

declare module "better-auth/client" {
  interface User {
    role: "owner" | "admin" | "manager" | "user";
    status?: "active" | "suspended" | "pending";
    banned?: boolean;
    banReason?: string | null;
    banExpires?: Date | null;
    invitedBy?: string | null;
    invitedAt?: Date | null;
  }
}
