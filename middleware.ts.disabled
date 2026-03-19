import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "campuslink_secret_change_in_production"
);

// Routes that require authentication
const PROTECTED = ["/member", "/investor", "/president", "/treasurer", "/secretary", "/board"];
// Role-to-route mapping
const ROLE_ROUTES: Record<string, string> = {
  member: "/member",
  investor: "/investor",
  president: "/president",
  treasurer: "/treasurer",
  secretary: "/secretary",
  boardMember: "/board",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (pathname.startsWith("/auth") || pathname === "/" || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Check if accessing a protected route
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Verify session cookie
  const token = req.cookies.get("campuslink_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    const expectedPath = ROLE_ROUTES[role];

    // Allow president to access board and treasurer/financials routes too
    if (role === "president") {
      if (pathname.startsWith("/board") || pathname.startsWith("/treasurer/financials") || pathname.startsWith("/treasurer/shareholders") || pathname.startsWith("/investor/proposals")) {
        return NextResponse.next();
      }
    }

    // Allow boardMember to access proposals
    if (role === "boardMember" && pathname.startsWith("/investor/proposals")) {
      return NextResponse.next();
    }

    // Allow everyone to access meetings, their personal savings and profile
    if (pathname.startsWith("/board/meetings") || pathname.startsWith("/member") || pathname.startsWith("/profile")) {
      return NextResponse.next();
    }

    // Ensure user is on correct dashboard
    if (expectedPath && !pathname.startsWith(expectedPath)) {
      return NextResponse.redirect(new URL(expectedPath, req.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token
    const response = NextResponse.redirect(new URL("/auth/login", req.url));
    response.cookies.delete("campuslink_session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
