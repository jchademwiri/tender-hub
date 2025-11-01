import { headers } from "next/headers";
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
        role: fullUser.role,
        status: fullUser.status,
        banned: fullUser.banned,
        banReason: fullUser.banReason,
        banExpires: fullUser.banExpires,
        invitedBy: fullUser.invitedBy,
        invitedAt: fullUser.invitedAt,
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
  return requireRole(["admin", "owner"]);
}

export async function requireManager() {
  return requireRole(["admin", "owner", "manager"]);
}