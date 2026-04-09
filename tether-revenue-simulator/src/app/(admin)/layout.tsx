import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/db/server";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { TetherLogo } from "@/components/shared/TetherLogo";

/**
 * Admin layout with Supabase Auth guard.
 * Redirects to /login if user is not authenticated or not in admin_users.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();

  // Create a Supabase client that reads auth from cookies
  const supabaseAuth = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll() {
          // Server components can't set cookies — handled in middleware
        },
      },
    }
  );

  // Check Supabase Auth session
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify user is an admin
  const supabase = createServerClient();
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (!adminUser) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Admin Header */}
      <header className="bg-white border-b border-brand-secondary/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TetherLogo size={30} className="text-brand-primary" />
            <span className="font-display text-xl font-bold text-brand-primary">
              Tether
            </span>
            <span className="text-sm text-brand-muted">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6 text-sm">
              <a
                href="/dashboard"
                className="text-brand-dark hover:text-brand-tether transition-colors font-medium"
              >
                Leads
              </a>
              <a
                href="/analytics"
                className="text-brand-muted hover:text-brand-tether transition-colors"
              >
                Analytics
              </a>
              <a
                href="/tokens"
                className="text-brand-muted hover:text-brand-tether transition-colors"
              >
                New User Account
              </a>
            </nav>
            <div className="flex items-center gap-3 border-l border-brand-secondary/50 pl-6">
              <span className="text-xs text-brand-muted">
                {adminUser.email}
              </span>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
