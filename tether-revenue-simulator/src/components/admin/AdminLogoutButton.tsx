"use client";

import { createBrowserClient } from "@/lib/db/browser";

export function AdminLogoutButton() {
  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-brand-muted hover:text-brand-warm transition-colors"
    >
      Sign out
    </button>
  );
}
