import { createAuthClient } from "better-auth/client";
import { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
});

// Export commonly used auth methods
export const { signOut, signIn, signUp } = authClient;