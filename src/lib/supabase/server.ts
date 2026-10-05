import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for the SERVER (server components, server actions and route
 * handlers). It reads the signed-in customer's session from cookies.
 *
 * Returns null when Supabase is not configured yet, so the shop can still run
 * in demo mode instead of crashing.
 */
export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  /**
   * Typed as SetAllCookies (from @supabase/ssr) purely so TypeScript knows
   * what `cookiesToSet` is. Without the annotation it would be implicitly any.
   */
  const setAll: SetAllCookies = (cookiesToSet) => {
    try {
      for (const { name, value, options } of cookiesToSet) {
        cookieStore.set(name, value, options);
      }
    } catch {
      // Called from a server component, where cookies are read-only.
      // The middleware refreshes the session instead, so this is safe.
    }
  };

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll,
    },
  });
}

/** True when the public Supabase settings are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}