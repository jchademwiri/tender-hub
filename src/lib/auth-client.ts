// TODO: Fix Better Auth client imports
// import { createAuthClient } from "better-auth/client";

// Temporary placeholder until Better Auth imports are fixed
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
