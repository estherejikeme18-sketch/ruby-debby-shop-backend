import Link from "next/link";
import CartTable from "@/components/CartTable";
import OrderSummary from "@/components/OrderSummary";
import { getCart } from "@/lib/cart";

export const metadata = { title: "Your cart" };

export default async function CartPage() {
  const cart = await getCart();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your cart</h1>

      {cart.lines.length === 0 ? (
        <div className="rounded-lg border border-rose-100 bg-white p-10 text-center">
          <p className="mb-4 text-gray-600">
            Your basket is empty. Nothing in here but tumbleweed.
          </p>
          <Link
            href="/"
            className="inline-block rounded-md bg-[#8a1538] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#6d0f2b]"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <CartTable lines={cart.lines} />
            <Link
              href="/"
              className="inline-block text-sm hover:text-[#8a1538]"
            >
              &larr; Continue shopping
            </Link>
          </div>

          <div className="space-y-4">
            <OrderSummary cart={cart} showShippingHint />
            <p className="text-center text-xs text-gray-500">
              Delivery is priced by state, so you will see the exact fee at
              checkout.
            </p>
            <Link
              href="/checkout"
              className="block rounded-md bg-[#8a1538] px-4 py-3 text-center font-medium text-white hover:bg-[#6d0f2b]"
            >
              Proceed to checkout
            </Link>
            <p className="text-center text-xs text-gray-500">
              {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} in your
              basket
            </p>
          </div>
        </div>
      )}
    </div>
  );
}