import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with anon key for browser-side operations.
 * Only needed if we expose any client-side Supabase queries (e.g., admin auth).
 * CPO flows do NOT use this — they go through API routes.
 */
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(supabaseUrl, anonKey);
}
