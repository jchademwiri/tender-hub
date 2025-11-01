// Temporary auth configuration placeholder
// TODO: Fix Better Auth imports and restore full configuration

// Temporary placeholder until Better Auth imports are fixed
export const auth = {
  api: {
    handler: () => {
      throw new Error("Auth not configured");
    },
  },
} as any;

// Export auth client for compatibility
export const authClient = {
  signOut: async () => {
    throw new Error("Auth client not configured");
  },
  signIn: async () => {
    throw new Error("Auth client not configured");
  },
  signUp: async () => {
    throw new Error("Auth client not configured");
  },
};

// Export commonly used auth methods
export const { signOut, signIn, signUp } = authClient;

/*
// TODO: Restore this configuration when Better Auth imports are fixed
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { ac, admin, manager, owner, user } from "@/lib/permissions";

// Store deleted user data temporarily for afterDelete hook
let deletedUserData: { role?: string | null } | null = null;

export const auth = betterAuth({
  // Full configuration here...
});
*/
