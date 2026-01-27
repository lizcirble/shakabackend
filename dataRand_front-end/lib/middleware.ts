// middleware.ts
// Place this file in the root of your project (same level as app/ folder)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Check if user is trying to access the auth page
  if (path === "/auth") {
    // Check for Privy auth token in cookies
    // Adjust the cookie name based on your Privy configuration
    const privyToken = request.cookies.get("privy-token")?.value ||
                       request.cookies.get("privy-id-token")?.value ||
                       request.cookies.get("privy-refresh-token")?.value;

    // If user has a token, redirect them to tasks
    if (privyToken) {
      return NextResponse.redirect(new URL("/tasks", request.url));
    }
  }

  // For all other routes, continue normally
  return NextResponse.next();
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};