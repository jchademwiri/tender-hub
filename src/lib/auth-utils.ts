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
    console.log("requireAuthAPI: Starting authentication check");
    const session = await getSessionWithRole();
    console.log("requireAuthAPI: Session result:", { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userRole: session?.user?.role 
    });
    
    if (!session) {
      console.log("requireAuthAPI: No session found, returning 401");
      return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
    }
    return { session };
  } catch (error) {
    console.error("requireAuthAPI: Auth error:", error);
    return { error: NextResponse.json({ error: "Authentication failed" }, { status: 401 }) };
  }
}

export async function requireRoleAPI(allowedRoles: string[]) {
  console.log("requireRoleAPI: Checking roles:", allowedRoles);
  const authResult = await requireAuthAPI();
  if (authResult.error) {
    console.log("requireRoleAPI: Auth failed, returning error");
    return authResult;
  }
  
  const { session } = authResult;
  console.log("requireRoleAPI: User role:", session.user.role, "Allowed:", allowedRoles);
  
  if (!allowedRoles.includes(session.user.role)) {
    console.log("requireRoleAPI: Role not allowed, returning 403");
    return { 
      error: NextResponse.json(
        { error: `Access denied. Required roles: ${allowedRoles.join(", ")}` }, 
        { status: 403 }
      ) 
    };
  }
  
  console.log("requireRoleAPI: Role check passed");
  return { session };
}

export async function requireAdminAPI() {
  return requireRoleAPI(["admin"]);
}

export async function requireManagerAPI() {
  return requireRoleAPI(["admin", "manager"]);
}