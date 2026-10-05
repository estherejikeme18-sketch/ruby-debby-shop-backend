import { calculateShipping, formatMoney } from "./money";
import type { CheckoutState } from "./types";
import { validateCheckout } from "./validation";

export { validateCheckout };
export type { CheckoutState };

/** The state the checkout form starts in. */
export const initialCheckoutState: CheckoutState = {
  ok: false,
  message: "",
  errors: {},
  values: {},
};

/** Reads a form field as a string without worrying about it being null. */
export function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Turns raw form data into either a validated customer or a list of errors. */
export function validateForm(formData: FormData) {
  return validateCheckout({
    fullName: readField(formData, "fullName"),
    email: readField(formData, "email"),
    phone: readField(formData, "phone"),
    address: readField(formData, "address"),
    city: readField(formData, "city"),
    state: readField(formData, "state"),
    postcode: readField(formData, "postcode"),
    country: readField(formData, "country"),
    notes: readField(formData, "notes"),
  });
}

/**
 * Works out the delivery fee for an order, and keeps the money honest.
 *
 * This runs ON THE SERVER, on the validated state. The fee the customer saw in
 * the browser is only a preview - this is the number that gets saved, so the
 * client can never influence it.
 *
 * Returns `ok: false` if the state is not one we deliver to, which would mean
 * a customer would otherwise pay nothing for delivery.
 */
export function resolveShipping(
  subtotalCents: number,
  state: string,
): { ok: boolean; shippingCents: number; totalCents: number } {
  const fee = calculateShipping(subtotalCents, state);
  const shippingCents = fee ?? 0;

  return {
    ok: fee !== null,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}

/** A plain-text version of the order, used in the email and the terminal log. */
export function buildSummaryText(order: {
  orderNumber: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  items: { productName: string; quantity: number; unitPriceCents: number }[];
}): string {
  const lines = order.items.map(
    (item) =>
      `${item.quantity} x ${item.productName} - ${formatMoney(
        item.unitPriceCents * item.quantity,
      )}`,
  );

  return [
    `Order ${order.orderNumber}`,
    ...lines,
    "",
    `Subtotal: ${formatMoney(order.subtotalCents)}`,
    `Delivery: ${order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}`,
    `Total: ${formatMoney(order.totalCents)}`,
  ].join("\n");
}

/** A friendly order reference, for example RDF-20261002-4F7A. */
export function generateOrderNumber(): string {
  const now = new Date();
  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const random = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `RDF-${date}-${random}`;
}

/**
 * Escapes text before it goes into an HTML email. Without this, a customer
 * could type HTML into the "name" field and it would be rendered in the email.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}