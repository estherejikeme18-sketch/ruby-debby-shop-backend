import Image from "next/image";
import { removeFromCartAction, updateQuantityAction } from "@/app/actions";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import type { CartLine } from "@/lib/types";

export default function CartTable({ lines }: { lines: CartLine[] }) {
  return (
    <ul className="divide-y divide-rose-50 rounded-lg border border-rose-100 bg-white">
      {lines.map((line) => (
        <li key={line.id} className="flex flex-wrap items-center gap-4 p-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-rose-50">
            {line.imageUrl ? (
              <Image
                src={line.imageUrl}
                alt={line.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-medium">{line.name}</p>
            <p className="text-sm text-gray-500">
              {formatMoney(line.priceCents)} each
            </p>
          </div>

          <form action={updateQuantityAction} className="flex items-center gap-2">
            <input type="hidden" name="productId" value={line.id} />
            <label
              className="text-sm text-gray-500"
              htmlFor={`quantity-${line.id}`}
            >
              Qty
            </label>
            <select
              id={`quantity-${line.id}`}
              name="quantity"
              defaultValue={String(line.quantity)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            >
              {Array.from(
                { length: MAX_QUANTITY_PER_LINE },
                (_, index) => index + 1,
              ).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            >
              Update
            </button>
          </form>

          <div className="w-24 text-right font-medium">
            {formatMoney(line.priceCents * line.quantity)}
          </div>

          <form action={removeFromCartAction}>
            <input type="hidden" name="productId" value={line.id} />
            <button
              type="submit"
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}