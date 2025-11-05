// Auth configuration for better-auth v1.3.27 compatibility
// Mock implementation with session persistence for development

import { NextRequest } from "next/server";

// Simple in-memory session store for mock implementation
const sessions = new Map<string, any>();
const users = new Map<string, any>();

// Mock user data - in real app this would be in database
const mockUsers = {
  "admin@test.com": {
    id: "admin-1",
    email: "admin@test.com",
    name: "Admin User",
    role: "admin",
    status: "active"
  },
  "admin@admin.com": {
    id: "admin-1",
    email: "admin@admin.com",
    name: "Admin User",
    role: "admin",
    status: "active"
  },
  "manager@test.com": {
    id: "manager-1",
    email: "manager@test.com",
    name: "Manager User",
    role: "manager",
    status: "active"
  },
  "manager@manager.com": {
    id: "manager-1",
    email: "manager@manager.com",
    name: "Manager User",
    role: "manager",
    status: "active"
  },
  "user@test.com": {
    id: "user-1",
    email: "user@test.com",
    name: "Regular User",
    role: "user",
    status: "active"
  },
  "user@user.com": {
    id: "user-1",
    email: "user@user.com",
    name: "Regular User",
    role: "user",
    status: "active"
  }
};

// Initialize users map
Object.entries(mockUsers).forEach(([email, userData]) => {
  users.set(email, userData);
});

function generateSessionId(): string {
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `session_${Date.now()}_${randomPart}`;
}

function createUserFromEmail(email: string) {
  const [username, domain] = email.split('@');
  const lowerUsername = username.toLowerCase();
  
  let role = 'user';
  if (lowerUsername.includes('admin')) {
    role = 'admin';
  } else if (lowerUsername.includes('manager')) {
    role = 'manager';
  }
  
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: email,
    name: username.charAt(0).toUpperCase() + username.slice(1).replace(/[_-]/g, ' '),
    role: role,
    status: "active"
  };
}

export const auth = {
  // Mock configuration for compatibility
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret",
  
  // Mock handler for API routes
  handler: (request: NextRequest) => {
    return new Response(JSON.stringify({ error: "Mock auth endpoint" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },
  
  // Mock API for compatibility
  api: {
    getSession: async ({ headers }: { headers: Headers }) => {
      try {
        const authHeader = headers.get("authorization")?.replace("Bearer ", "");
        const cookieHeader = headers.get("cookie");
        const sessionId = authHeader ||
                         (cookieHeader ? cookieHeader.split("session=")[1]?.split(";")[0] : undefined);
        
        if (!sessionId) {
          return null;
        }
        
        const session = sessions.get(sessionId);
        if (!session) {
          return null;
        }
        
        return session;
      } catch (error) {
        console.error("Error getting session:", error);
        return null;
      }
    },
    
    getUser: async ({ headers }: { headers: Headers }) => {
      try {
        const authHeader = headers.get("authorization")?.replace("Bearer ", "");
        const cookieHeader = headers.get("cookie");
        const sessionId = authHeader ||
                         (cookieHeader ? cookieHeader.split("session=")[1]?.split(";")[0] : undefined);
        
        const session = sessionId ? sessions.get(sessionId) : null;
        return session ? { user: session.user } : { user: null };
      } catch (error) {
        console.error("Error getting user:", error);
        return { user: null };
      }
    },
    
    updateUser: async ({ headers, body }: { headers: Headers; body: any }) => {
      try {
        const authHeader = headers.get("authorization")?.replace("Bearer ", "");
        const cookieHeader = headers.get("cookie");
        const sessionId = authHeader ||
                         (cookieHeader ? cookieHeader.split("session=")[1]?.split(";")[0] : undefined);
        
        const session = sessionId ? sessions.get(sessionId) : null;
        if (session && sessionId && body?.name) {
          session.user.name = body.name;
          sessions.set(sessionId, session);
        }
        
        return {
          user: session?.user || null,
          error: null
        };
      } catch (error) {
        console.error("Error updating user:", error);
        return { user: null, error: { message: "Failed to update user" } };
      }
    },
    
    signInEmail: async ({ headers, body }: { headers: Headers; body: any }) => {
      try {
        const { email, password } = body;
        
        if (!email) {
          return {
            user: null,
            error: { code: "INVALID_EMAIL", message: "Email is required" }
          };
        }
        
        // Try to find existing user first
        let user = users.get(email);
        
        // If user doesn't exist, create a new one based on email
        if (!user) {
          user = createUserFromEmail(email);
          users.set(email, user);
        }
        
        const sessionId = generateSessionId();
        const session = {
          user,
          session: {
            id: sessionId,
            userId: user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        };
        
        sessions.set(sessionId, session);

        return {
          user,
          session: session.session,
          error: null
        };
      } catch (error) {
        console.error("Error signing in:", error);
        return {
          user: null,
          error: { message: "Authentication failed" }
        };
      }
    },
    
    signUpEmail: async ({ headers, body }: { headers: Headers; body: any }) => {
      return {
        user: null,
        error: { message: "Sign up not implemented in mock" }
      };
    },
    
    signOut: async ({ headers }: { headers: Headers }) => {
      try {
        const authHeader = headers.get("authorization")?.replace("Bearer ", "");
        const cookieHeader = headers.get("cookie");
        const sessionId = authHeader ||
                         (cookieHeader ? cookieHeader.split("session=")[1]?.split(";")[0] : undefined);
        
        if (sessionId) {
          sessions.delete(sessionId);
        }
        
        return { error: null };
      } catch (error) {
        console.error("Error signing out:", error);
        return { error: { message: "Sign out failed" } };
      }
    }
  }
};

// Export auth client methods with fallbacks
export const signOut = () => Promise.resolve();
export const signIn = () => Promise.resolve();
export const signUp = () => Promise.resolve();

// Export API methods for better-auth v1.3.27 compatibility
export const createAuthClient = () => ({});
export const getSession = () => ({});
export const getUser = () => ({});
export const updateUser = () => ({});
export const signInEmail = () => ({});
export const signUpEmail = () => ({});
export const signOutAction = () => ({});
export const getSessionAction = () => ({});
