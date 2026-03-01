import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/profile",
  "/my-vault",
  "/shipments/history",
  "/admin",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if the current path is protected
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Auth.js v5 uses AUTH_SECRET and a different cookie name than v4
  // In production (HTTPS): __Secure-authjs.session-token
  // In development (HTTP): authjs.session-token
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  // Debug logging — check Vercel function logs
  console.log(
    `[Middleware] Path: ${pathname} | Token: ${token ? "EXISTS" : "NULL"} | Role: ${token?.role ?? "none"}`
  );

  // No token — redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes — check for ADMIN role
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/my-vault/:path*",
    "/shipments/history",
    "/admin/:path*",
  ],
};
