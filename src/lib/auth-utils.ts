import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "./auth";

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

export async function getSessionWithRole() {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return null;
    }

    // Fetch full user data from database including role and status
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (userData.length === 0) {
      return null;
    }

    const fullUser = userData[0];

    return {
      ...session,
      user: {
        ...session.user,
        id: fullUser.id,
        role: fullUser.role,
        status: fullUser.status,
        banned: fullUser.banned,
        banReason: fullUser.banReason,
        banExpires: fullUser.banExpires,
        invitedBy: fullUser.invitedBy,
        invitedAt: fullUser.invitedAt,
        image: fullUser.image,
      },
    };
  } catch (error) {
    console.error("Error getting session with role:", error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSessionWithRole();
  if (!session) {
    throw new Error("Authentication required");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}`);
  }
  return session;
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireManager() {
  return requireRole(["admin", "manager"]);
}

// API-specific auth functions that return NextResponse for better error handling
export async function requireAuthAPI() {
  try {
    const session = await getSessionWithRole();
    if (!session) {
      return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
    }
    return { session };
  } catch (error) {
    console.error("Auth error:", error);
    return { error: NextResponse.json({ error: "Authentication failed" }, { status: 401 }) };
  }
}

export async function requireRoleAPI(allowedRoles: string[]) {
  const authResult = await requireAuthAPI();
  if (authResult.error) {
    return authResult;
  }
  
  const { session } = authResult;
  if (!allowedRoles.includes(session.user.role)) {
    return { 
      error: NextResponse.json(
        { error: `Access denied. Required roles: ${allowedRoles.join(", ")}` }, 
        { status: 403 }
      ) 
    };
  }
  
  return { session };
}

export async function requireAdminAPI() {
  return requireRoleAPI(["admin"]);
}

export async function requireManagerAPI() {
  return requireRoleAPI(["admin", "manager"]);
}