import { cookies } from "next/headers";
import { summarise } from "./money";
import { getProductsByIds } from "./products";
import type { CartSummary } from "./types";

/**
 * The cart lives in a cookie, so it survives page reloads and the server can
 * read it while rendering a page.
 *
 * Only `{ id, quantity }` is stored. Prices are always re-read from the
 * database (see getProductsByIds in products.ts).
 */
const CART_COOKIE = "ruby_debby_cart";

/** Stops someone putting 900 dresses in the basket by editing the cookie. */
export const MAX_QUANTITY_PER_LINE = 10;

type StoredLine = { id: string; quantity: number };

function parseCookieValue(raw: string | undefined): StoredLine[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        const line = entry as Partial<StoredLine>;
        return {
          id: String(line.id ?? ""),
          quantity: Number(line.quantity ?? 0),
        };
      })
      .filter((line) => line.id.length > 0 && line.quantity > 0)
      .map((line) => ({
        id: line.id,
        quantity: Math.min(Math.floor(line.quantity), MAX_QUANTITY_PER_LINE),
      }));
  } catch {
    // A malformed cookie should never break the site.
    return [];
  }
}

async function readStoredCart(): Promise<StoredLine[]> {
  const cookieStore = await cookies();
  return parseCookieValue(cookieStore.get(CART_COOKIE)?.value);
}

/** Read the raw cookie lines WITHOUT pricing (used for the sign-in merge). */
export async function readCookieLines(): Promise<StoredLine[]> {
  return readStoredCart();
}

/** The signed-in customer's user id, or null for guests. */
async function currentUserId(): Promise<string | null> {
  const { getCurrentUserId } = await import("./cart-db");
  return getCurrentUserId();
}

async function writeStoredCart(lines: StoredLine[]): Promise<void> {
  const cookieStore = await cookies();

  if (lines.length === 0) {
    cookieStore.delete(CART_COOKIE);
    return;
  }

  cookieStore.set(CART_COOKIE, JSON.stringify(lines), {
    httpOnly: true, // browser JavaScript cannot read or edit it
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/** Adds a product, or tops up the quantity if it is already in the cart. */
export async function addToCart(productId: string, quantity = 1): Promise<void> {
  // Signed in -> shared database cart (syncs with the mobile app).
  const userId = await currentUserId();
  if (userId) {
    const { dbAddToCart } = await import("./cart-db");
    await dbAddToCart(userId, productId, quantity);
    return;
  }

  const lines = await readStoredCart();
  const existing = lines.find((line) => line.id === productId);

  if (existing) {
    existing.quantity = Math.min(
      existing.quantity + quantity,
      MAX_QUANTITY_PER_LINE,
    );
  } else {
    lines.push({
      id: productId,
      quantity: Math.min(Math.max(quantity, 1), MAX_QUANTITY_PER_LINE),
    });
  }

  await writeStoredCart(lines);
}

/** Sets an exact quantity. A quantity of 0 removes the line. */
export async function setLineQuantity(
  productId: string,
  quantity: number,
): Promise<void> {
  const userId = await currentUserId();
  if (userId) {
    const { dbSetQuantity } = await import("./cart-db");
    await dbSetQuantity(userId, productId, quantity);
    return;
  }

  const lines = await readStoredCart();
  const capped = Math.min(Math.floor(quantity), MAX_QUANTITY_PER_LINE);

  if (capped <= 0) {
    await writeStoredCart(lines.filter((line) => line.id !== productId));
    return;
  }

  const existing = lines.find((line) => line.id === productId);
  if (existing) {
    existing.quantity = capped;
    await writeStoredCart(lines);
    return;
  }

  await writeStoredCart([...lines, { id: productId, quantity: capped }]);
}

/**
 * The customer picks their delivery state at checkout, and we remember it in a
 * cookie so it is still there if they come back. This is only a convenience -
 * the state is validated again when the order is placed.
 */
const STATE_COOKIE = "ruby_debby_state";

export async function getDeliveryState(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(STATE_COOKIE)?.value ?? null;
}

export async function setDeliveryState(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearDeliveryState(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STATE_COOKIE);
}

export async function removeFromCart(productId: string): Promise<void> {
  const userId = await currentUserId();
  if (userId) {
    const { dbRemoveFromCart } = await import("./cart-db");
    await dbRemoveFromCart(userId, productId);
    return;
  }

  const lines = await readStoredCart();
  await writeStoredCart(lines.filter((line) => line.id !== productId));
}

export async function clearCart(): Promise<void> {
  const userId = await currentUserId();
  if (userId) {
    const { dbClearCart } = await import("./cart-db");
    await dbClearCart(userId);
  }
  await writeStoredCart([]);
}

/**
 * The cart, priced for a delivery destination.
 *
 * Pass the state when you know it (checkout). Leave it out and `shippingCents`
 * comes back as null, meaning "the fee is not known until we know where it is
 * going".
 */
export async function getCart(state?: string | null): Promise<CartSummary> {
  // Signed-in customers read the SHARED database cart (syncs with mobile).
  const userId = await currentUserId();
  let stored: StoredLine[];
  if (userId) {
    const { readDbCart } = await import("./cart-db");
    stored = (await readDbCart(userId)).map((line) => ({
      id: line.productId,
      quantity: line.quantity,
    }));
  } else {
    stored = await readStoredCart();
  }

  if (stored.length === 0) {
    return {
      lines: [],
      itemCount: 0,
      subtotalCents: 0,
      shippingCents: 0,
      totalCents: 0,
    };
  }

  const products = await getProductsByIds(stored.map((line) => line.id));
  const byId = new Map(products.map((product) => [product.id, product]));

  // Lines whose product was deleted or hidden simply disappear. Because the
  // cookie stores ids and not copies, the cart repairs itself.
  const lines = stored
    .map((line) => {
      const product = byId.get(line.id);
      if (!product) return null;
      const available = Math.max(1, Math.min(product.stock, line.quantity));
      return { ...product, quantity: available };
    })
    .filter((line): line is CartSummary["lines"][number] => Boolean(line));

  return { lines, ...summarise(lines, state) };
}

/** Used by the header badge. */
export async function getCartItemCount(): Promise<number> {
  const userId = await currentUserId();
  if (userId) {
    const { readDbCart } = await import("./cart-db");
    const lines = await readDbCart(userId);
    return lines.reduce((total, line) => total + line.quantity, 0);
  }
  const stored = await readStoredCart();
  return stored.reduce((total, line) => total + line.quantity, 0);
}