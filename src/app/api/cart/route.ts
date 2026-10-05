import { NextResponse } from "next/server";
import { readDbCart } from "@/lib/cart-db";
import { getProductsByIds } from "@/lib/products";
import { summarise } from "@/lib/money";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/cart - the signed-in customer's synced cart.
 *
 * The MOBILE APP calls this with the customer's Supabase access token
 * (Authorization: Bearer <token>) and gets back the same cart the website
 * shows. That is the two-way sync from the website's side.
 */
export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Mobile app sends its token; website sends cookies. Accept either.
  const authHeader = request.headers.get("authorization");
  let userId: string | null = null;
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    userId = data.user.id;
  } else {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const lines = await readDbCart(userId);
  const products = await getProductsByIds(lines.map((l) => l.productId));
  const byId = new Map(products.map((p) => [p.id, p]));

  const detailed = lines
    .map((line) => {
      const product = byId.get(line.productId);
      if (!product) return null;
      return { ...product, quantity: line.quantity };
    })
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  return NextResponse.json({
    lines: detailed,
    ...summarise(detailed.map((l) => ({ priceCents: l.priceCents, quantity: l.quantity }))),
  });
}
