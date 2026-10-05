import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { getOrdersForCurrentUser } from "@/lib/orders";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const metadata = { title: "My orders" };

export default async function OrdersPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  if (!data.user) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-rose-100 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold">Sign in to see your orders</h1>
        <p className="mt-2 text-sm text-gray-600">
          Orders are matched to the email address you sign in with.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-md bg-[#8a1538] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#6d0f2b]"
        >
          Sign in with Google
        </Link>
      </div>
    );
  }

  const orders = await getOrdersForCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My orders</h1>
        <p className="mt-1 text-sm text-gray-600">
          Signed in as {data.user.email}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-rose-100 bg-white p-10 text-center text-gray-600">
          <p>No orders yet.</p>
          {!isSupabaseConfigured() ? (
            <p className="mt-2 text-sm text-amber-700">
              Demo mode: orders are not saved to a database until Supabase is
              configured.
            </p>
          ) : null}
          <Link
            href="/"
            className="mt-4 inline-block text-sm hover:text-[#8a1538]"
          >
            Go to the shop
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-lg border border-rose-100 bg-white p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-[#8a1538]">
                  {order.orderNumber}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>

              <ul className="my-3 space-y-1 text-sm text-gray-600">
                {order.items.map((item, index) => (
                  <li
                    key={`${order.id}-${index}`}
                    className="flex justify-between gap-4"
                  >
                    <span>
                      {item.quantity} x {item.productName}
                    </span>
                    <span>
                      {formatMoney(item.unitPriceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rose-50 pt-3 text-sm">
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs uppercase tracking-wide text-[#8a1538]">
                  {order.status}
                </span>
                <span className="font-semibold">
                  Total {formatMoney(order.totalCents)}
                </span>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Delivering to {order.shippingAddress}, {order.city}
                {order.shippingState ? `, ${order.shippingState}` : ""},{" "}
                {order.postcode}, {order.country}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}