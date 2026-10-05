"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearCart, clearDeliveryState, getCart } from "@/lib/cart";
import { resolveShipping, validateForm } from "@/lib/checkout-helpers";
import {
  sendNewOrderNotification,
  sendOrderConfirmationEmail,
} from "@/lib/mailgun";
import { createOrder } from "@/lib/orders";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CheckoutState } from "@/lib/types";

/**
 * The heart of the checkout.
 *
 * The order of operations matters, and this is why:
 *   1. validate again on the server (never trust the browser)
 *   2. read the cart from the cookie - ids only, prices come from the database
 *   3. write the order and its items to the database
 *   4. send the emails
 *   5. empty the cart, then redirect
 *
 * Emails are sent AFTER the order is safely stored. If Mailgun is down, the
 * customer still has their order, and we just report the email problem.
 */
export async function placeOrderAction(
  _previousState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const { ok, errors, values, email } = validateForm(formData);

  if (!ok) {
    return {
      ok: false,
      message: "Please fix the fields highlighted below.",
      errors,
      values,
    };
  }

  const cart = await getCart(values.state);

  if (cart.lines.length === 0) {
    return {
      ok: false,
      message: "Your cart is empty, so there is nothing to order.",
      errors: {},
      values,
    };
  }

  /**
   * Work out the delivery fee here, on the server, from the state that the
   * server just validated. The fee shown in the browser is only a preview -
   * this is the number that gets charged and saved.
   */
  const shipping = resolveShipping(cart.subtotalCents, values.state);

  if (!shipping.ok) {
    return {
      ok: false,
      message: "We could not work out delivery for that state. Please choose your state again.",
      errors: { state: "Please choose your state from the list." },
      values,
    };
  }

  // The cart's own shipping figure is ignored - we use the one we just
  // calculated, so the two can never disagree.
  const pricedCart = {
    ...cart,
    shippingCents: shipping.shippingCents,
    totalCents: shipping.totalCents,
  };

  // Attach the order to the signed-in customer, if there is one.
  let userId: string | null = null;
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  let order;
  try {
    order = await createOrder({
      details: { ...values, email },
      cart: pricedCart,
      userId,
    });
  } catch (error) {
    console.error("[checkout] could not create the order", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not save your order. Please try again.",
      errors: {},
      values,
    };
  }

  const [receipt] = await Promise.all([
    sendOrderConfirmationEmail(order),
    sendNewOrderNotification(order),
  ]);

  await clearCart();
  await clearDeliveryState();
  revalidatePath("/", "layout");

  const params = new URLSearchParams({
    order: order.orderNumber,
    email: order.customerEmail,
    saved: order.isDemo ? "demo" : "database",
    mail: receipt.sent ? "sent" : receipt.demo ? "demo" : "failed",
  });

  redirect(`/checkout/success?${params.toString()}`);
}