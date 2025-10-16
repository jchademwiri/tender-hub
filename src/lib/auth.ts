import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { admin as adminPlugin } from "better-auth/plugins"

import { ac, admin, manager, user, owner } from '@/lib/permissions';

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL provider
  }),
  plugins: [
    adminPlugin({
      ac,
      roles: { owner, admin, user, manager },
      defaultRole: "user"
    }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  rateLimit: {
    window: 15 * 60, // 15 minutes
    max: 100, // Max requests per window
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
});