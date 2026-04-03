import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/db/server";

/**
 * Admin session data returned after successful authentication.
 */
export interface AdminSession {
  adminId: string;
  email: string;
  role: "sales" | "leadership" | "admin";
}

/**
 * Create a Supabase client that reads the auth session from request cookies.
 * Uses @supabase/ssr for proper cookie handling in Next.js API routes.
 */
function createSupabaseRouteClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll() {
        // In API routes, we can't set cookies on the request.
        // Cookie refresh happens in middleware.
      },
    },
  });
}

/**
 * Get the current admin session from request cookies.
 * Returns null if the user is not authenticated or not an admin.
 *
 * Flow:
 * 1. Read Supabase Auth session from cookies
 * 2. Verify the user exists in the admin_users table
 * 3. Return admin session data
 */
export async function getAdminSession(
  request: NextRequest
): Promise<AdminSession | null> {
  try {
    const supabaseAuth = createSupabaseRouteClient(request);
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser();

    if (error || !user) return null;

    // Verify user is in admin_users table
    const supabase = createServerClient();
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, email, role")
      .eq("id", user.id)
      .single();

    if (adminError || !adminUser) return null;

    return {
      adminId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role as AdminSession["role"],
    };
  } catch {
    return null;
  }
}

/**
 * Require admin authentication for an API route.
 * Returns the admin session or an error response.
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ session: AdminSession } | { response: NextResponse }> {
  const session = await getAdminSession(request);

  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      ),
    };
  }

  return { session };
}

/**
 * Check if a request has a valid Supabase Auth session cookie.
 * Used in middleware for fast edge-level auth checks (does NOT verify admin_users membership).
 */
export function hasAuthCookie(request: NextRequest): boolean {
  // Supabase stores auth in sb-<project-ref>-auth-token cookies
  const cookies = request.cookies.getAll();
  return cookies.some(
    (c) =>
      c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );
}
