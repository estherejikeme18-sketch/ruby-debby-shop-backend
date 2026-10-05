import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the BROWSER. Only call this from a "use client"
 * component.
 *
 * It uses the public anon key, which is safe to send to the browser because
 * Row Level Security in the database decides what that key may read and write.
 *
 * The service_role key must NEVER be used here.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return createBrowserClient(url, anonKey);
}