import { getSupabaseAdminClient } from "./supabase/admin";
import { getSupabaseServerClient } from "./supabase/server";

/**
 * SYNCED CART - shared by the website and the mobile app.
 *
 * The website used to keep the cart in a browser cookie, which no phone
 * could ever see. Now, when a customer is SIGNED IN, their cart lives in
 * the `cart_items` table instead (see supabase/cart-sync.sql): one row per
 * (user, product). The mobile app reads and writes the SAME table with the
 * SAME login, so adding an item on either side appears on the other.
 *
 * Guests (not signed in) keep the old cookie cart - there is no account
 * to attach their rows to yet. On sign-in we merge the cookie into the
 * database once, then clear the cookie.
 */

export type DbCartLine = { productId: string; quantity: number };

/** The signed-in customer's id, or null for guests. */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}


/**
 * Read the signed-in customer's cart rows from the database.
 * Returns [] for guests or when the table does not exist yet.
 */
export async function readDbCart(userId: string): Promise<DbCartLine[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("cart_items")
    .select("product_id, quantity")
    .eq("user_id", userId);

  if (error) {
    console.warn(`[cart-db] ${error.message}`);
    return [];
  }

  return (data ?? []).map((row) => ({
    productId: String(row.product_id),
    quantity: Math.max(1, Math.min(10, Number(row.quantity) || 1)),
  }));
}

/** Replace the customer's whole cart (used by merge + clear). */
async function writeDbCart(
  userId: string,
  lines: DbCartLine[],
): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  const { error: delError } = await admin
    .from("cart_items")
    .delete()
    .eq("user_id", userId);
  if (delError) throw new Error(delError.message);

  if (lines.length === 0) return;

  const { error: insError } = await admin.from("cart_items").insert(
    lines.map((line) => ({
      user_id: userId,
      product_id: line.productId,
      quantity: Math.max(1, Math.min(10, Math.floor(line.quantity))),
    })),
  );
  if (insError) throw new Error(insError.message);
}

/** Add (or top up) one product in the database cart. */
export async function dbAddToCart(
  userId: string,
  productId: string,
  quantity = 1,
): Promise<void> {
  const lines = await readDbCart(userId);
  const existing = lines.find((line) => line.productId === productId);
  if (existing) {
    existing.quantity = Math.min(10, existing.quantity + quantity);
  } else {
    lines.push({ productId, quantity: Math.min(10, Math.max(1, quantity)) });
  }
  await writeDbCart(userId, lines);
}

/** Set an exact quantity (0 removes the line) in the database cart. */
export async function dbSetQuantity(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const lines = await readDbCart(userId);
  const capped = Math.min(10, Math.floor(quantity));
  const next =
    capped <= 0
      ? lines.filter((line) => line.productId !== productId)
      : lines.some((line) => line.productId === productId)
        ? lines.map((line) =>
            line.productId === productId
              ? { ...line, quantity: capped }
              : line,
          )
        : [...lines, { productId, quantity: capped }];
  await writeDbCart(userId, next);
}

/** Remove one product from the database cart. */
export async function dbRemoveFromCart(
  userId: string,
  productId: string,
): Promise<void> {
  const lines = await readDbCart(userId);
  await writeDbCart(
    userId,
    lines.filter((line) => line.productId !== productId),
  );
}

/** Empty the database cart (used after a successful order). */
export async function dbClearCart(userId: string): Promise<void> {
  await writeDbCart(userId, []);
}

/** Merge a guest cookie cart into the database once, at sign-in. */
export async function mergeCookieIntoDb(
  userId: string,
  cookieLines: DbCartLine[],
): Promise<void> {
  if (cookieLines.length === 0) return;
  const dbLines = await readDbCart(userId);
  const merged = new Map<string, number>();
  for (const line of dbLines) merged.set(line.productId, line.quantity);
  for (const line of cookieLines) {
    merged.set(
      line.productId,
      Math.min(10, Math.max(merged.get(line.productId) ?? 0, line.quantity)),
    );
  }
  await writeDbCart(
    userId,
    [...merged.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    })),
  );
}