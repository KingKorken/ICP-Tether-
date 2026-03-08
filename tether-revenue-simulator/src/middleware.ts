import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for token validation on /sim/t/* routes.
 * Runs on the Edge — validates access token format before page renders.
 * Full token DB validation happens at the page level (Server Component).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to simulator routes
  if (!pathname.startsWith("/sim/t/")) {
    return NextResponse.next();
  }

  // Extract token from URL
  const segments = pathname.split("/");
  const urlToken = segments[3]; // /sim/t/{token}

  if (!urlToken) {
    return redirectToLanding(request, "missing-token");
  }

  // Validate UUID format (basic check)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(urlToken)) {
    return redirectToLanding(request, "invalid-token");
  }

  // Token format is valid — allow through.
  // The page Server Component will do the full DB validation.
  return NextResponse.next();
}

function redirectToLanding(request: NextRequest, error: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/sim/t/:path*"],
};
