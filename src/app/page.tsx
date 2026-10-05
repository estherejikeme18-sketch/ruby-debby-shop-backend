import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/products";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory =
    typeof params.category === "string" && params.category.length > 0
      ? params.category
      : undefined;

  const [products, categories] = await Promise.all([
    getProducts(activeCategory),
    getCategories(),
  ]);

  const demoCatalogue = !isSupabaseConfigured();

  return (
    <div className="space-y-10">
      {/* ---------------- Hero ---------------- */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#8a1538] to-[#4b0a1e] px-6 py-14 text-white sm:px-12">
        <p className="text-[11px] uppercase tracking-[0.3em] text-rose-200">
          Fashion Home
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
          Clothes and accessories that feel like they were made for you.
        </h1>
        <p className="mt-4 max-w-xl text-rose-100">
          Dresses, bags, shoes and finishing touches - chosen with care and
          delivered to your door. Free delivery on larger orders.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#products"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-[#8a1538] hover:bg-rose-50"
          >
            Shop the collection
          </a>
          <Link
            href="/cart"
            className="rounded-md border border-white/50 px-5 py-2.5 text-sm font-medium hover:bg-white/10"
          >
            View your cart
          </Link>
        </div>
      </section>

      {demoCatalogue ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Demo mode: Supabase is not configured yet, so these products come from{" "}
          <code>src/lib/demo-data.ts</code> instead of a database. Add your
          Supabase keys to <code>.env.local</code> and run{" "}
          <code>supabase/schema.sql</code> to switch over.
        </p>
      ) : null}

      {/* ---------------- Category filter ---------------- */}
      {categories.length > 0 ? (
        <nav aria-label="Product categories" className="flex flex-wrap gap-2">
          <Link
            href="/"
            className={`rounded-full border px-4 py-1.5 text-sm ${
              activeCategory
                ? "border-gray-300 hover:bg-gray-50"
                : "border-[#8a1538] bg-[#8a1538] text-white"
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/?category=${encodeURIComponent(category)}`}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                activeCategory === category
                  ? "border-[#8a1538] bg-[#8a1538] text-white"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {category}
            </Link>
          ))}
        </nav>
      ) : null}

      {/* ---------------- Products ---------------- */}
      <section id="products" className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">
            {activeCategory ?? "Everything in store"}
          </h2>
          <p className="text-sm text-gray-500">
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="rounded-lg border border-rose-100 bg-white p-8 text-center text-gray-600">
            Nothing here yet. Run <code>supabase/schema.sql</code> to insert the
            sample collection.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}