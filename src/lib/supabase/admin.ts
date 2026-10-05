import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * SERVER ONLY - never import this into a "use client" component.
 *
 * This client uses the service_role key, which ignores every Row Level
 * Security policy. It is used for exactly one job: saving an order after the
 * customer checks out.
 *
 * The service_role key must never be exposed as a NEXT_PUBLIC_ variable, and
 * must never be committed to Git.
 *
 * Returns null when the key is missing, which puts checkout into demo mode.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}