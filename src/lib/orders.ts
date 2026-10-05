import { buildSummaryText, generateOrderNumber } from "./checkout-helpers";
import { getSupabaseAdminClient } from "./supabase/admin";
import { getSupabaseServerClient } from "./supabase/server";
import type {
  CartSummary,
  CustomerDetails,
  OrderItemRecord,
  OrderRecord,
} from "./types";

/** Postgres uuid columns only accept real UUIDs, so check before inserting. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | null): boolean {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Saves an order to the database.
 *
 * If the service_role key is missing we skip the database and return a demo
 * order instead, printing it to the terminal. That keeps the whole checkout
 * clickable before Supabase is set up.
 */
export async function createOrder(input: {
  details: CustomerDetails;
  cart: CartSummary;
  userId: string | null;
}): Promise<OrderRecord> {
  const { details, cart, userId } = input;
  const orderNumber = generateOrderNumber();
  const createdAt = new Date().toISOString();

  const items: OrderItemRecord[] = cart.lines.map((line) => ({
    productId: line.id,
    productName: line.name,
    unitPriceCents: line.priceCents,
    quantity: line.quantity,
  }));

  /**
   * The cart leaves `shippingCents` as null until the delivery state is known.
   * By the time an order is created it always is, but we coerce anyway so the
   * saved order can never hold a null delivery fee.
   */
  const shippingCents = cart.shippingCents ?? 0;
  const totalCents = cart.subtotalCents + shippingCents;

  const base: Omit<OrderRecord, "id" | "isDemo"> = {
    orderNumber,
    customerName: details.fullName,
    customerEmail: details.email.toLowerCase(),
    customerPhone: details.phone || null,
    shippingAddress: details.address,
    city: details.city,
    shippingState: details.state,
    postcode: details.postcode,
    country: details.country,
    subtotalCents: cart.subtotalCents,
    shippingCents,
    totalCents,
    status: "paid",
    createdAt,
    items,
  };

  const admin = getSupabaseAdminClient();

  // ---- demo mode: no database configured ----
  if (!admin) {
    console.log(
      `\n[demo order] SUPABASE_SERVICE_ROLE_KEY is not set, so nothing was saved.\n${buildSummaryText(
        {
          orderNumber,
          subtotalCents: cart.subtotalCents,
          shippingCents,
          totalCents,
          items,
        },
      )}\n`,
    );
    return { ...base, id: `demo-${orderNumber}`, isDemo: true };
  }

  // ---- 1. the order itself ----
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: userId,
      customer_name: details.fullName,
      customer_email: details.email.toLowerCase(),
      customer_phone: details.phone || null,
      shipping_address: details.address,
      city: details.city,
      shipping_state: details.state,
      postcode: details.postcode,
      country: details.country,
      delivery_notes: details.notes || null,
      subtotal_cents: cart.subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      status: "paid",
    })
    .select("id, created_at")
    .single();

  if (orderError || !order) {
    throw new Error(
      `Could not save the order: ${orderError?.message ?? "unknown error"}`,
    );
  }

  // ---- 2. the lines inside it ----
  const { error: itemsError } = await admin.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      // Demo ids are not UUIDs, so store null rather than failing the insert.
      product_id: isUuid(item.productId) ? item.productId : null,
      product_name: item.productName,
      unit_price_cents: item.unitPriceCents,
      quantity: item.quantity,
    })),
  );

  if (itemsError) {
    // Don't leave a half-written order behind in the database.
    await admin.from("orders").delete().eq("id", order.id);
    throw new Error(`Could not save the order items: ${itemsError.message}`);
  }

  return {
    ...base,
    id: order.id,
    createdAt: order.created_at,
    isDemo: false,
  };
}

/** The shape of a row returned by the query below, including its nested items. */
type OrderWithItemsRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  city: string;
  shipping_state: string | null;
  postcode: string;
  country: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  status: string;
  created_at: string;
  order_items:
    | {
        product_id: string | null;
        product_name: string;
        unit_price_cents: number;
        quantity: number;
      }[]
    | null;
};

/**
 * Orders belonging to the signed-in customer.
 *
 * There is no `where user_id = ...` here on purpose: Row Level Security in the
 * database already limits this query to the customer's own rows. See the
 * policies at the bottom of supabase/schema.sql.
 */
export async function getOrdersForCurrentUser(): Promise<OrderRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, customer_phone, shipping_address, city, shipping_state, postcode, country, subtotal_cents, shipping_cents, total_cents, status, created_at, order_items(product_id, product_name, unit_price_cents, quantity)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.warn(`[orders] ${error.message}`);
    return [];
  }

  return ((data ?? []) as unknown as OrderWithItemsRow[]).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    city: row.city,
    shippingState: row.shipping_state,
    postcode: row.postcode,
    country: row.country,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    totalCents: row.total_cents,
    status: row.status,
    createdAt: row.created_at,
    items: (row.order_items ?? []).map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      unitPriceCents: item.unit_price_cents,
      quantity: item.quantity,
    })),
    isDemo: false,
  }));
}

/** Plain-text receipt, built from a saved order. */
export function orderItemsToText(order: OrderRecord): string {
  return buildSummaryText({
    orderNumber: order.orderNumber,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    items: order.items,
  });
}