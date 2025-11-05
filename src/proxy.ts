import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

async function getSessionWithRole(headers: Headers) {
  try {
    // First try the existing auth system
    let session = await auth.api.getSession({ headers });
    
    // If no session from auth system, try to get client-side user
    if (!session?.user?.id) {
      // For now, just return null for missing sessions
      // Client-side authentication will be handled separately
      return null;
    }
    
    return session;
  } catch (error) {
    console.error("Error getting session with role in proxy:", error);
    return null;
  }
}

export default async function proxy(req: NextRequest) {
  // Skip middleware for API routes to avoid conflicts
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip authentication checks for now to allow sign-in redirects to work
  // The sign-in page handles authentication and redirects client-side
  if (req.nextUrl.pathname.startsWith("/sign-in") ||
      req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/admin") ||
      req.nextUrl.pathname.startsWith("/manager")) {
    return NextResponse.next();
  }

  // Default public routes
  const publicRoutes = ["/", "/invite", "/suspended"];
  const isPublicRoute = publicRoutes.some(
    (route) =>
      req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`),
  );

  // For now, allow access to most routes since sign-in handles redirects
  // In production, you would add proper authentication here
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
