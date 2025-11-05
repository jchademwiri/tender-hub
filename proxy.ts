import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Define route patterns
  const publicRoutes = ['/', '/sign-in', '/status', '/suspended'];
  const authRoutes = ['/sign-in'];
  const protectedRoutes = ['/dashboard', '/admin', '/manager', '/user', '/account'];
  
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Get session cookie (optimistic check)
  const sessionCookie = getSessionCookie(request);
  const hasSessionCookie = !!sessionCookie;

  // Redirect users with session away from auth pages
  if (hasSessionCookie && isAuthRoute) {
    // Default redirect to dashboard, let client-side handle role-based routing
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect users without session to sign-in for protected routes
  if (!hasSessionCookie && isProtectedRoute) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};