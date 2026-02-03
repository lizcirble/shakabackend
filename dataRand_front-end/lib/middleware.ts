// middleware.ts
// Place this file in the root of your project (same level as app/ folder)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const privyToken =
    request.cookies.get("privy-token")?.value ||
    request.cookies.get("privy-id-token")?.value ||
    request.cookies.get("privy-refresh-token")?.value;

  const protectedRoutes = [
    "/tasks",
    "/my-work",
    "/earnings",
    "/compute",
    "/education-impact",
    "/client",
    "/notifications",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  // If user is trying to access a protected route without a token, redirect to auth
  if (isProtectedRoute && !privyToken) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // If user is trying to access the auth page with a token, redirect to tasks
  if (path === "/auth" && privyToken) {
    return NextResponse.redirect(new URL("/tasks", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};