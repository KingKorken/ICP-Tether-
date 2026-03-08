import type { ReactNode } from "react";

/**
 * Admin layout with auth guard.
 * TODO: Add Supabase Auth check for admin users.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-light">
      {/* Admin Header */}
      <header className="bg-white border-b border-brand-secondary/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-display text-xl font-bold text-brand-primary">
              Tether
            </span>
            <span className="text-sm text-brand-muted">Admin Dashboard</span>
          </div>
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
              Tokens
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
