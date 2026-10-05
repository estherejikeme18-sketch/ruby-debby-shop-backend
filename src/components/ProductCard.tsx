import Image from "next/image";
import Link from "next/link";
import { addToCartAction } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-rose-100 bg-white transition hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] bg-rose-50/50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No photo yet
            </div>
          )}

          {product.category ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] uppercase tracking-wide text-[#8a1538]">
              {product.category}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="font-medium leading-tight">
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-[#8a1538]"
          >
            {product.name}
          </Link>
        </h2>

        {product.description ? (
          <p className="line-clamp-2 text-sm text-gray-600">
            {product.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="font-semibold">{formatMoney(product.priceCents)}</span>

          <form action={addToCartAction}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <button
              type="submit"
              disabled={soldOut}
              className="rounded-md bg-[#8a1538] px-3 py-2 text-sm font-medium text-white hover:bg-[#6d0f2b] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {soldOut ? "Sold out" : "Add to cart"}
            </button>
          </form>
        </div>

        {!soldOut && product.stock <= 10 ? (
          <p className="text-xs text-amber-600">
            Only {product.stock} left in stock
          </p>
        ) : null}
      </div>
    </article>
  );
}