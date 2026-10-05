import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware runs before every page request.
 *
 * Its only job is to refresh the Supabase session cookie. Supabase access
 * tokens are short lived; without this a customer would be silently signed out
 * part way through shopping.
 *
 * If Supabase is not configured the middleware does nothing, so demo mode
 * keeps working.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  /**
   * Typed as SetAllCookies so TypeScript knows what `cookiesToSet` is.
   * Any refreshed cookies must be written to BOTH the request (so this render
   * sees them) and the response (so the browser stores them).
   */
  const setAll: SetAllCookies = (cookiesToSet) => {
    for (const { name, value } of cookiesToSet) {
      request.cookies.set(name, value);
    }
    response = NextResponse.next({ request });
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, options);
    }
  };

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll,
    },
  });

  // Calling getUser() is what triggers the refresh. Do not remove it.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Everything except Next.js internals and static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};