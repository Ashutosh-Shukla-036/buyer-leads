import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/buyers")) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyJwt<{ userId: string }>(token);

    if (!payload) {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    // ✅ Add userId into headers for downstream APIs
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
}

export const config = {
  matcher: ["/api/buyers/:path*"],
};
