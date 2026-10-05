import { NextResponse, type NextRequest } from "next/server";
import { readCookieLines, clearCart } from "@/lib/cart";
import { getCurrentUserId, mergeCookieIntoDb } from "@/lib/cart-db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Both Google AND email/password sign-ins land here.
 *
 * Supabase gives us a one-time `code`, which we exchange for a real session.
 * The session is stored in cookies, which is how the rest of the app
 * knows who is signed in.
 *
 * After sign-in we merge any guest cookie cart into the shared database
 * cart once, so nothing the customer added before signing in is lost -
 * and the mobile app (same account) sees it too.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const googleError = searchParams.get("error_description");
  if (googleError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(googleError)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing-code`);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(
      `${origin}/login?error=supabase-not-configured`,
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Merge the guest cookie cart into the shared DB cart, then clear it.
  try {
    const userId = await getCurrentUserId();
    if (userId) {
      const cookieLines = await readCookieLines();
      await mergeCookieIntoDb(
        userId,
        cookieLines.map((line) => ({
          productId: line.id,
          quantity: line.quantity,
        })),
      );
      await clearCart();
    }
  } catch (mergeError) {
    console.warn("[auth] cart merge failed", mergeError);
  }

  // `next` must start with "/" so this can only ever redirect within our own
  // site. Without this check, an attacker could use it to send customers to
  // another domain after login.
  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(`${origin}${safeNext}`);
}