import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addToCartAction } from "@/app/actions";
import ProductCard from "@/components/ProductCard";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { getProductBySlug, getProducts } from "@/lib/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const maxQuantity = Math.max(1, Math.min(product.stock, MAX_QUANTITY_PER_LINE));
  const isSoldOut = product.stock <= 0;

  // "You may also like" - same category, excluding the product itself.
  const related = product.category
    ? (await getProducts(product.category))
        .filter((item) => item.id !== product.id)
        .slice(0, 4)
    : [];

  return (
    <div className="space-y-12">
      <Link href="/" className="inline-block text-sm hover:text-[#8a1538]">
        &larr; Back to the collection
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-rose-100 bg-rose-50/50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No photo yet
            </div>
          )}
        </div>

        <div className="space-y-5">
          {product.category ? (
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a1538]">
              {product.category}
            </p>
          ) : null}

          <h1 className="text-3xl font-semibold leading-tight">
            {product.name}
          </h1>
          <p className="text-2xl font-semibold">
            {formatMoney(product.priceCents)}
          </p>

          {product.description ? (
            <p className="leading-relaxed text-gray-600">
              {product.description}
            </p>
          ) : null}

          <p className="text-sm text-gray-500">
            {isSoldOut
              ? "Currently out of stock"
              : `${product.stock} in stock and ready to ship`}
          </p>

          <form
            action={addToCartAction}
            className="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="productId" value={product.id} />

            <div>
              <label
                htmlFor="quantity"
                className="mb-1 block text-sm font-medium"
              >
                Quantity
              </label>
              <select
                id="quantity"
                name="quantity"
                defaultValue="1"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {Array.from(
                  { length: maxQuantity },
                  (_, index) => index + 1,
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSoldOut}
              className="rounded-md bg-[#8a1538] px-6 py-2.5 font-medium text-white hover:bg-[#6d0f2b] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSoldOut ? "Sold out" : "Add to cart"}
            </button>
          </form>

          <div className="space-y-1 border-t border-rose-50 pt-5 text-sm text-gray-600">
            <p>Free delivery on orders over N150,000.</p>
            <p>We ship from Abuja. Delivery is priced by state at checkout.</p>
            <p>Not right? Send it back within 14 days.</p>
          </div>

          <Link
            href="/cart"
            className="inline-block text-sm font-medium text-[#8a1538] hover:underline"
          >
            Go to cart &rarr;
          </Link>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">You may also like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}