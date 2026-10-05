"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addToCart,
  clearCart,
  removeFromCart,
  setDeliveryState,
  setLineQuantity,
} from "@/lib/cart";
import { isValidState } from "@/lib/nigeria";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server Actions.
 *
 * These are functions that run on the SERVER but are called straight from a
 * <form> in the page. No fetch(), no API route, no client-side state to keep
 * in sync.
 */

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Anything that changes the cart must tell Next.js to re-render the pages. */
function refreshEverywhere(): void {
  revalidatePath("/", "layout");
}

export async function addToCartAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!productId) return;

  await addToCart(productId, Number.isFinite(quantity) ? quantity : 1);
  refreshEverywhere();
}

export async function updateQuantityAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);

  if (!productId) return;

  await setLineQuantity(productId, Number.isFinite(quantity) ? quantity : 0);
  refreshEverywhere();
}

export async function removeFromCartAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  await removeFromCart(productId);
  refreshEverywhere();
}

export async function clearCartAction(): Promise<void> {
  await clearCart();
  refreshEverywhere();
}

/**
 * Called automatically when the customer changes the state dropdown, so the
 * delivery fee in the order summary updates straight away.
 *
 * Only a value from the real state list is accepted, otherwise a bogus state
 * could be used to dodge the delivery fee.
 */
export async function setDeliveryStateAction(formData: FormData): Promise<void> {
  const state = String(formData.get("state") ?? "");

  if (isValidState(state)) {
    await setDeliveryState(state);
  }

  refreshEverywhere();
}

/**
 * Google sign-in.
 *
 * We ask Supabase for the Google consent URL and send the customer there.
 * Supabase holds the Google client id and secret (set in the Supabase
 * dashboard), so they never appear anywhere in this code.
 */
export async function signInWithGoogleAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect("/login?error=supabase-not-configured");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    redirect(
      `/login?error=${encodeURIComponent(
        error?.message ?? "Could not start Google sign-in.",
      )}`,
    );
  }

  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}