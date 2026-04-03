import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser-side operations.
 * Uses @supabase/ssr to store the auth session in cookies (not localStorage).
 * This is critical — the middleware and admin layout read auth from cookies.
 */
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createSupabaseBrowserClient(supabaseUrl, anonKey);
}
