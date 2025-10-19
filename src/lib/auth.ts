import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { ac, admin, manager, user, owner } from "@/lib/permissions";
import { eq, count } from "drizzle-orm";

// Store deleted user data temporarily for afterDelete hook
let deletedUserData: { role?: string | null } | null = null;

export const auth = betterAuth({
  // ✅ CRITICAL FIX: Enable auth but disable public signup
  emailAndPassword: {
    enabled: true, // ✅ MUST be true for invitation acceptance
    disableSignUp: false, // ✅ Enable for invitation acceptance
    requireEmailVerification: false, // ✅ Disable verification for invited users
    minPasswordLength: 3,
    maxPasswordLength: 128,

    sendResetPassword: async ({ user, url, token }, request) => {
      const { sendPasswordResetEmail } = await import("@/lib/email");
      await sendPasswordResetEmail(user.email, url);
    },

    resetPasswordTokenExpiresIn: 3600,

    onPasswordReset: async ({ user }, request) => {
      // Audit log
      await db.insert(schema.auditLog).values({
        id: crypto.randomUUID(),
        userId: user.id,
        action: "password_reset",
        ipAddress: request?.headers?.get("x-forwarded-for") || null,
        createdAt: new Date()
      });

      // Notify user
      const { sendPasswordChangedEmail } = await import("@/lib/email");
      await sendPasswordChangedEmail(user.email);
    }
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const { sendEmailVerification } = await import("@/lib/email");
      await sendEmailVerification(user.email, url);
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      rateLimit: schema.rateLimit,
    }
  }),

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update daily
    freshAge: 60 * 5, // 5 minutes for sensitive ops
    disableSessionRefresh: false
  },

  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: false, // Disable for invitation-only system
    }
  },

  user: {
    deleteUser: {
      enabled: true,

      sendDeleteAccountVerification: async ({ user, url, token }, request) => {
        const { sendAccountDeletionEmail } = await import("@/lib/email");
        await sendAccountDeletionEmail(user.email, url);
      },

      beforeDelete: async (user, request) => {
        // ✅ CRITICAL: Prevent deleting last admin
        const fullUser = await db.select().from(schema.user).where(eq(schema.user.id, user.id)).limit(1);
        if (fullUser[0]?.role === "admin") {
          const adminCount = await db.select({ count: count() })
            .from(schema.user)
            .where(eq(schema.user.role, "admin"));

          if (adminCount[0].count <= 1) {
            throw new APIError("FORBIDDEN", {
              message: "Cannot delete the last admin. Create another admin first."
            });
          }
        }

        // Store user data for afterDelete hook (since user will be deleted)
        deletedUserData = { role: fullUser[0]?.role || null };

        // GDPR compliance
        await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
        await db.delete(schema.pageViews).where(eq(schema.pageViews.userId, user.id));
        await db.delete(schema.userInteractions).where(eq(schema.userInteractions.userId, user.id));
        await db.delete(schema.events).where(eq(schema.events.userId, user.id));
        await db.delete(schema.userConsent).where(eq(schema.userConsent.userId, user.id));
      },

      afterDelete: async (user, request) => {
        // Audit log - use stored role from beforeDelete instead of querying deleted user
        const deletedUserRole = deletedUserData?.role || null;

        await db.insert(schema.auditLog).values({
          id: crypto.randomUUID(),
          userId: "system",
          action: "user_deleted",
          metadata: JSON.stringify({
            deletedUserId: user.id,
            email: user.email,
            role: deletedUserRole
          }),
          createdAt: new Date()
        });

        // Clear the stored data after use
        deletedUserData = null;
      }
    },

    changeEmail: {
      enabled: false // ✅ Users cannot change email
    }
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    customRules: {
      "/sign-in/email": { window: 60, max: 3 },
      "/sign-up/email": { window: 60, max: 10 }, // Enable sign-up with rate limiting
      "/forget-password": { window: 300, max: 3 },
      "/api/users/invite": { window: 3600, max: 10 }, // 10 invites/hour
      "/api/invitations/*/resend": { window: 300, max: 3 }
    },
    storage: "database",
    modelName: "rateLimit"
  },

  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "cf-connecting-ip", "x-real-ip"],
      disableIpTracking: false
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "tender-hub",
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true
    },
    disableCSRFCheck: false
  },

  plugins: [
    adminPlugin({
      ac,
      roles: { owner, admin, user, manager },
      defaultRole: "user",
      adminRoles: ["admin", "owner"]
    }),
    nextCookies() // ✅ MUST be last
  ],

  databaseHooks: {
    user: {
      create: {
        before: async (userData, ctx) => {
          // ✅ Allow user creation for sign-up and invitation acceptance
          // Exception: First user becomes admin
          const userCount = await db.select({ count: count() }).from(schema.user);

          if (userCount[0].count === 0) {
            // First user becomes admin
            return {
              data: {
                ...userData,
                role: "admin",
                status: "active",
                emailVerified: true
              }
            };
          }

          // Allow sign-up for invitation acceptance
          return { data: userData };
        },

        after: async (user) => {
          const fullUser = await db.select().from(schema.user).where(eq(schema.user.id, user.id)).limit(1);
          await db.insert(schema.auditLog).values({
            id: crypto.randomUUID(),
            userId: user.id,
            action: "user_created",
            metadata: JSON.stringify({ role: fullUser[0]?.role }),
            createdAt: new Date()
          });
        }
      },

      update: {
        before: async (userData, ctx) => {
          if (!ctx?.context?.session) {
            throw new APIError("UNAUTHORIZED");
          }

          const session = ctx.context.session;

          // ✅ Prevent email changes
          if (userData.email && userData.email !== session.user.email) {
            throw new APIError("FORBIDDEN", {
              message: "Email changes are not allowed"
            });
          }

          // ✅ Prevent unauthorized role changes
          if (userData.role && userData.role !== session.user.role) {
            if (session.user.role !== "admin") {
              throw new APIError("FORBIDDEN", {
                message: "Only admins can change roles"
              });
            }
          }

          return { data: userData };
        }
      }
    }
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Log all auth events
      const authPaths = ["/sign-in", "/sign-out", "/forget-password", "/reset-password"];

      if (ctx?.path && authPaths.some(path => ctx.path.startsWith(path))) {
        await db.insert(schema.auditLog).values({
          id: crypto.randomUUID(),
          userId: ctx.context?.newSession?.user.id || "anonymous",
          action: ctx.path,
          ipAddress: ctx.request?.headers?.get("x-forwarded-for") || null,
          metadata: JSON.stringify({
            success: !ctx.context?.returned,
            userAgent: ctx.request?.headers?.get("user-agent") || null
          }),
          createdAt: new Date()
        });
      }
    })
  },

  onAPIError: {
    throw: false,
    onError: (error, ctx) => {
      console.error("Auth Error:", error instanceof Error ? error.message : String(error), "Context available:", !!ctx);
    }
  },

  logger: {
    disabled: false,
    level: process.env.NODE_ENV === "production" ? "error" : "info"
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ]
});