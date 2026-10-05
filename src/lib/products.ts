import {
  demoCategories,
  demoProducts,
  findDemoProduct,
  findDemoProductBySlug,
} from "./demo-data";
import { getSupabaseServerClient, isSupabaseConfigured } from "./supabase/server";
import type { Product } from "./types";

/** The shape of a row in the `products` table (snake_case, as Postgres likes). */
type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  image_url: string | null;
  stock: number;
};

const COLUMNS = "id, slug, name, description, category, price_cents, image_url, stock";

/** Databases speak snake_case, JavaScript speaks camelCase. Convert once, here. */
function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    priceCents: row.price_cents,
    imageUrl: row.image_url,
    stock: row.stock,
  };
}

/** The whole catalogue, or one category of it. */
export async function getProducts(category?: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return category
      ? demoProducts.filter((product) => product.category === category)
      : demoProducts;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return demoProducts;

  let query = supabase
    .from("products")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.warn(
      `[products] could not read the products table (${error.message}); showing the sample catalogue instead.`,
    );
    return category
      ? demoProducts.filter((product) => product.category === category)
      : demoProducts;
  }

  return (data ?? []).map(mapRow);
}

/** The category list for the homepage filter. */
export async function getCategories(): Promise<string[]> {
  if (!isSupabaseConfigured()) return demoCategories;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return demoCategories;

  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("is_active", true)
    .not("category", "is", null);

  if (error) return demoCategories;

  const unique = new Set<string>();
  for (const row of (data ?? []) as { category: string | null }[]) {
    if (row.category) unique.add(row.category);
  }

  return [...unique].sort();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return findDemoProductBySlug(slug) ?? null;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return findDemoProductBySlug(slug) ?? null;

  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn(`[products] ${error.message}`);
    return findDemoProductBySlug(slug) ?? null;
  }

  return mapRow(data);
}

/**
 * Used by the cart. The cookie only stores product ids, never prices, so the
 * price is always read fresh from the database. That way a customer can never
 * hang on to a stale price, or change it in their browser.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  if (!isSupabaseConfigured()) {
    return ids
      .map((id) => findDemoProduct(id))
      .filter((product): product is Product => Boolean(product));
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .in("id", ids)
    .eq("is_active", true);

  if (error) {
    console.warn(`[products] ${error.message}`);
    return [];
  }

  return (data ?? []).map(mapRow);
}