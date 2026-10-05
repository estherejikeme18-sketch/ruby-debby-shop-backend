import { NextResponse } from "next/server";
import {
  dbAddToCart,
  dbRemoveFromCart,
  dbSetQuantity,
  getCurrentUserId,
} from "@/lib/cart-db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/cart/items - add / update / remove ONE line in the synced cart.
 *
 * Body: { productId, quantity }  (quantity 0 removes the line)
 *
 * Used by the mobile app with a Bearer token. The website uses server
 * actions instead, but both end up in the same cart_items rows.
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  let userId: string | null = null;
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const { data, error } = await supabase.auth.getUser(authHeader.slice(7));
    if (error || !data.user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    userId = data.user.id;
  } else {
    userId = await getCurrentUserId();
  }

  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { productId?: unknown; quantity?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const productId = String(body.productId ?? "");
  const quantity = Number(body.quantity ?? 1);
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  try {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      await dbRemoveFromCart(userId, productId);
    } else if (quantity === 1) {
      // Default add: top up by one (matches the website's Add to cart).
      const { readDbCart } = await import("@/lib/cart-db");
      const existing = (await readDbCart(userId)).find(
        (l) => l.productId === productId,
      );
      if (existing) {
        await dbSetQuantity(userId, productId, existing.quantity + 1);
      } else {
        await dbAddToCart(userId, productId, 1);
      }
    } else {
      await dbSetQuantity(userId, productId, quantity);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cart update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
