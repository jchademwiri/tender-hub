import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  // Skip middleware for API routes to avoid conflicts
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Enable authentication for protected routes
  const { nextUrl } = req;
  const session = await auth.api.getSession({ headers: req.headers });

  const isLoggedIn = !!session;
  const user = session?.user;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/sign-in", "/invite"];
  const isPublicRoute = publicRoutes.some(
    (route) =>
      nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`),
  );

  // Admin routes that require admin role
  const adminRoutes = ["/admin"];
  const isAdminRoute = adminRoutes.some(
    (route) =>
      nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`),
  );

  // Dashboard routes that require authentication
  const dashboardRoutes = ["/dashboard"];
  const isDashboardRoute = dashboardRoutes.some(
    (route) =>
      nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`),
  );

  // Redirect unauthenticated users trying to access protected routes
  if (!isLoggedIn && (isAdminRoute || isDashboardRoute)) {
    const redirectUrl = new URL("/sign-in", nextUrl.origin);
    redirectUrl.searchParams.set("redirect", nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect non-admin users trying to access admin routes
  if (
    isLoggedIn &&
    isAdminRoute &&
    user?.role !== "admin" &&
    user?.role !== "owner"
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // Redirect authenticated users away from public routes to dashboard
  if (isLoggedIn && isPublicRoute && nextUrl.pathname === "/") {
    // Check if there's a redirect parameter
    const redirectTo = nextUrl.searchParams.get("redirect");
    if (
      redirectTo &&
      (redirectTo.startsWith("/dashboard") || redirectTo.startsWith("/admin"))
    ) {
      return NextResponse.redirect(new URL(redirectTo, nextUrl.origin));
    }

    // Redirect based on user role
    let redirectUrl: string;
    if (user?.role === "admin" || user?.role === "owner") {
      redirectUrl = "/admin";
    } else if (user?.role === "manager") {
      redirectUrl = "/manager";
    } else {
      redirectUrl = "/dashboard";
    }
    return NextResponse.redirect(new URL(redirectUrl, nextUrl.origin));
  }

  return NextResponse.next();

  // Note: Alternative authentication flow removed. See ADR #123 or commit abc123 for historical implementation.
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
