import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;

  const isAdminRoute = pathname.startsWith("/admin");
  const isUserRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/payments");

  if (isAdminRoute || isUserRoute) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // Decode JWT payload (handling base64url format correctly for edge runtime)
      const payloadBase64 = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const decodedJson = atob(payloadBase64);
      const payload = JSON.parse(decodedJson);

      if (isAdminRoute && payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Invalid token or decoding error
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/account/:path*",
    "/messages/:path*",
    "/payments/:path*",
  ],
};
