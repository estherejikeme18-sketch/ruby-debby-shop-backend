"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { readCookieLines, clearCart } from "@/lib/cart-client";

/**
 * Email sign-in / sign-up, running in the BROWSER.
 *
 * The old server-action version could not merge the guest cookie cart
 * (server actions cannot read the request cookies set by the browser
 * client reliably here), so this client version signs in with the
 * browser client and merges the cookie cart through the /api/cart/merge
 * endpoint instead. Same account works in the mobile app afterwards.
 */
export async function emailSignInAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Enter your email and password." };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured yet. Add your keys to .env.local.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  await mergeCookieAfterSignIn();
  window.location.href = "/";
  return { ok: true, message: "Signed in! Taking you to the shop..." };
}

export async function emailSignUpAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 6) {
    return {
      ok: false,
      message: "Enter an email and a password of at least 6 characters.",
    };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured yet. Add your keys to .env.local.",
    };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  // Email confirmation OFF -> session exists straight away.
  if (data.session) {
    await mergeCookieAfterSignIn();
    window.location.href = "/";
    return { ok: true, message: "Account created - taking you to the shop..." };
  }

  return {
    ok: true,
    message:
      "Account created! Check your inbox for a confirmation link, then sign in. (Turn OFF email confirmation in Supabase Auth settings to skip this step in demos.)",
  };
}

/** Push the guest cookie cart into the shared DB cart after sign-in. */
async function mergeCookieAfterSignIn(): Promise<void> {
  try {
    const lines = readCookieLines();
    if (lines.length === 0) return;
    await fetch("/api/cart/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
    });
    clearCart();
  } catch {
    // Merge is best-effort; sign-in still succeeded.
  }
}
