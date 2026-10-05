import { zoneForState } from "./nigeria";

/**
 * Money helpers. Every amount in the app is an integer number of minor units.
 *
 * For Naira that minor unit is the kobo, so 4500000 means N45,000.00.
 * (If you switch to USD, the same numbers are cents.)
 *
 * WHY WHOLE NUMBERS: in JavaScript, 10.10 + 20.20 gives 30.299999999999997,
 * but 1010 + 2020 is exactly 3030. Money has to be exact, so the decimal
 * point only appears when we format a value for display.
 */

/**
 * Ruby Debby Fashion Home is based in Abuja, Nigeria, so Naira is the default.
 * You can still override it with NEXT_PUBLIC_CURRENCY in .env.local.
 */
const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY ?? "NGN").toUpperCase();

/**
 * Each currency gets a matching locale, so the symbol and the thousands
 * separator look right (Naira shows as N45,000.00 style formatting).
 */
const LOCALES: Record<string, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
  GHS: "en-GH",
  ZAR: "en-ZA",
  KES: "en-KE",
  INR: "en-IN",
  CAD: "en-CA",
  AUD: "en-AU",
};

const LOCALE = LOCALES[CURRENCY] ?? "en-NG";

export function formatMoney(minorUnits: number): string {
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: CURRENCY,
    }).format(minorUnits / 100);
  } catch {
    // An unrecognised currency code would throw, so fall back rather than
    // crashing every page in the shop.
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(minorUnits / 100);
  }
}

/** Orders of N150,000 or more are delivered free, whatever the state. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000000; // N150,000

/**
 * The delivery fee for a basket going to a particular state.
 *
 * Returns null when we do not know the state yet - which is the normal case on
 * the cart page, because the customer has not told us where they live. The
 * checkout page asks for the state and then shows the real fee.
 */
export function calculateShipping(
  subtotalCents: number,
  state?: string | null,
): number | null {
  if (subtotalCents <= 0) return 0;

  // Free delivery over the threshold, no matter which zone they are in.
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;

  const zone = zoneForState(state);
  if (!zone) return null;

  return zone.feeCents;
}

/** How much more they need to spend for free delivery (0 when already there). */
export function amountUntilFreeDelivery(subtotalCents: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
}

/**
 * Turns a list of (price, quantity) pairs into the totals we show and store.
 *
 * Pass the customer's state when you know it (at checkout). Leave it out on the
 * cart page and `shippingCents` comes back as null, meaning "not worked out yet".
 */
export function summarise(
  lines: { priceCents: number; quantity: number }[],
  state?: string | null,
) {
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const subtotalCents = lines.reduce(
    (total, line) => total + line.priceCents * line.quantity,
    0,
  );
  const shippingCents = calculateShipping(subtotalCents, state);

  return {
    itemCount,
    subtotalCents,
    shippingCents,
    // While the delivery fee is unknown the total is just the goods, so we
    // never show a total that we would have to change later.
    totalCents: subtotalCents + (shippingCents ?? 0),
  };
}