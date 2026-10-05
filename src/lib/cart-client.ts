/**
 * Tiny cookie helpers for the BROWSER.
 *
 * The guest cart cookie ("ruby_debby_cart") is httpOnly, so JavaScript
 * cannot read it - but the email sign-in merge needs the guest lines.
 * This mirrors the guest cart in a readable cookie the browser CAN see,
 * so after sign-in we can push those lines into the shared DB cart.
 */

const READABLE_COOKIE = "ruby_debby_cart_client";

export type ClientCartLine = { id: string; quantity: number };

export function readCookieLines(): ClientCartLine[] {
  if (typeof document === "undefined") return [];
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${READABLE_COOKIE}=`));
  if (!match) return [];
  try {
    const parsed: unknown = JSON.parse(
      decodeURIComponent(match.slice(READABLE_COOKIE.length + 1)),
    );
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        const line = entry as Partial<ClientCartLine>;
        return {
          id: String(line.id ?? ""),
          quantity: Number(line.quantity ?? 0),
        };
      })
      .filter((line) => line.id.length > 0 && line.quantity > 0);
  } catch {
    return [];
  }
}

/** Remember the last product id added as guest (best-effort mirror). */
export function rememberGuestAdd(productId: string, quantity = 1): void {
  try {
    const lines = readCookieLines();
    const existing = lines.find((line) => line.id === productId);
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + quantity);
    } else {
      lines.push({ id: productId, quantity });
    }
    document.cookie = `${READABLE_COOKIE}=${encodeURIComponent(
      JSON.stringify(lines),
    )}; path=/; max-age=${60 * 60 * 24 * 30}`;
  } catch {
    // Best-effort only.
  }
}

export function clearCart(): void {
  try {
    document.cookie = `${READABLE_COOKIE}=; path=/; max-age=0`;
  } catch {
    // Best-effort only.
  }
}
