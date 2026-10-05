import Link from "next/link";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import DeliveryStatePicker from "@/components/DeliveryStatePicker";
import OrderSummary from "@/components/OrderSummary";
import { getCart, getDeliveryState } from "@/lib/cart";
import { DEFAULT_STATE } from "@/lib/nigeria";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  // The delivery state is remembered in a cookie, and defaults to Abuja
  // because that is where the shop is. The customer can change it above.
  const state = (await getDeliveryState()) ?? DEFAULT_STATE;
  const cart = await getCart(state);

  // Nothing to buy? Send them back to the cart rather than showing a form
  // that cannot be submitted.
  if (cart.lines.length === 0) {
    redirect("/cart");
  }

  // If they are signed in, prefill the email field for them.
  let defaultEmail = "";
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    defaultEmail = data.user?.email ?? "";
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/cart" className="hover:text-[#8a1538]">
          Cart
        </Link>
        <span aria-hidden="true">&rarr;</span>
        <span className="font-medium text-gray-900">Checkout</span>
        <span aria-hidden="true">&rarr;</span>
        <span>Confirmation</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="mt-1 text-sm text-gray-600">
          {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} in your
          cart.
        </p>
      </div>

      <DeliveryStatePicker state={state} subtotalCents={cart.subtotalCents} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border border-rose-100 bg-white p-5">
          <h2 className="mb-1 font-semibold">Delivery details</h2>
          <p className="mb-4 text-sm text-gray-600">
            Delivering to <strong>{state}</strong>. Change it above if that is
            wrong.
          </p>
          <CheckoutForm defaultEmail={defaultEmail} state={state} />
        </section>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <OrderSummary cart={cart} state={state} />
          <Link href="/cart" className="inline-block text-sm hover:underline">
            &larr; Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}