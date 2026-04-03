import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware for:
 * 1. Token validation on /sim/t/* routes (format check only)
 * 2. Admin route protection (Supabase Auth session check)
 * 3. Supabase Auth session refresh (keeps cookies alive)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Simulator token routes: validate UUID format ---
  if (pathname.startsWith("/sim/t/")) {
    const segments = pathname.split("/");
    const urlToken = segments[3]; // /sim/t/{token}

    if (!urlToken) {
      return redirectToLanding(request, "missing-token");
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(urlToken)) {
      return redirectToLanding(request, "invalid-token");
    }

    return NextResponse.next();
  }

  // --- Admin routes: require Supabase Auth session ---
  if (isAdminRoute(pathname)) {
    return await handleAdminAuth(request);
  }

  return NextResponse.next();
}

/**
 * Check if a pathname is an admin-protected route.
 * The login page is NOT protected.
 */
function isAdminRoute(pathname: string): boolean {
  const adminRoutes = ["/dashboard", "/analytics", "/tokens", "/leads"];
  return adminRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Handle admin authentication via Supabase Auth cookie refresh.
 * This runs on the Edge — just checks if a valid session exists.
 * Full admin_users membership check happens in the layout (server component).
 */
async function handleAdminAuth(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          // Forward cookies to both the request and the response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  // This call refreshes the session token if needed and sets updated cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // No valid session — redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

function redirectToLanding(request: NextRequest, error: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/sim/t/:path*",
    "/dashboard",
    "/analytics",
    "/tokens",
    "/leads/:path*",
  ],
};
