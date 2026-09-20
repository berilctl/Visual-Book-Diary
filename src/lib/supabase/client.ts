import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser.
 * Uses public environment variables only; with row-level security enabled,
 * every query made with the anon key is limited to the user's own data.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
