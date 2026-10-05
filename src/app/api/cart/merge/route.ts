import { NextResponse } from "next/server";
import { mergeCookieIntoDb } from "@/lib/cart-db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/cart/merge - merge guest cookie lines into the synced cart.
 *
 * Body: { lines: [{ id, quantity }] } (website cookie shape) or
 *       { lines: [{ productId, quantity }] } (mobile shape).
 *
 * Called once right after email sign-in on the website, so items added
 * as a guest survive sign-in AND appear in the mobile app.
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
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { lines?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = Array.isArray(body.lines) ? body.lines : [];
  const lines = raw
    .map((entry) => {
      const line = entry as Record<string, unknown>;
      const productId = String(line.productId ?? line.id ?? "");
      const quantity = Number(line.quantity ?? 0);
      return { productId, quantity };
    })
    .filter((line) => line.productId.length > 0 && line.quantity > 0);

  try {
    await mergeCookieIntoDb(userId, lines);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Merge failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, merged: lines.length });
}
