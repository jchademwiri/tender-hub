import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";
import { eq } from "drizzle-orm";

// Helper function to determine role from email
function getDefaultRoleFromEmail(email: string): "owner" | "admin" | "manager" | "user" {
  const [username] = email.split('@');
  const lowerUsername = username.toLowerCase();
  
  if (lowerUsername.includes('admin')) {
    return 'admin';
  } else if (lowerUsername.includes('manager')) {
    return 'manager';
  }
  return 'user';
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // Don't allow direct input
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
        input: false,
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      banReason: {
        type: "string",
        required: false,
        input: false,
      },
      banExpires: {
        type: "date",
        required: false,
        input: false,
      },
      invitedBy: {
        type: "string",
        required: false,
        input: false,
      },
      invitedAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  
  hooks: {
    user: {
      created: async (user) => {
        // Set role based on email when user is created
        const role = getDefaultRoleFromEmail(user.email);
        
        // Update user with the determined role
        await db.update(user as any).set({ 
          role: role,
          status: 'active',
          banned: false,
        }).where(eq((user as any).id, user.id));
        
        return user;
      },
    },
    session: {
      created: async (session) => {
        console.log("Session created:", session.session.id);
        return session;
      },
    },
  },
  
  advanced: {
    generateId: () => {
      return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    },
  },
  
  plugins: [
    nextCookies(), // Enable automatic cookie handling for server actions
  ],
});
