import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for CLIENT components ("use client").
 *
 * Uses the public anon key only. Row Level Security in the database
 * (see supabase/schema.sql and supabase/cart-sync.sql) makes sure a
 * signed-in customer can only ever touch their own cart_items rows.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return createBrowserClient(url, anonKey);
}
