import {
  amountUntilFreeDelivery,
  formatMoney,
} from "@/lib/money";
import { zoneForState } from "@/lib/nigeria";
import type { CartSummary } from "@/lib/types";

/**
 * Read-only basket summary, shared by the cart, checkout and success pages, so
 * the totals the customer sees can never disagree with each other.
 *
 * `shippingCents` is null until we know the delivery state, which is why there
 * is a "Calculated at checkout" case below.
 */
export default function OrderSummary({
  cart,
  showShippingHint = false,
  state = null,
}: {
  cart: CartSummary;
  showShippingHint?: boolean;
  state?: string | null;
}) {
  const remaining = amountUntilFreeDelivery(cart.subtotalCents);
  const zone = zoneForState(state);
  const shippingKnown = cart.shippingCents !== null;

  return (
    <div className="rounded-lg border border-rose-100 bg-white p-5">
      <h2 className="mb-4 font-semibold">Order summary</h2>

      <ul className="mb-4 space-y-3 text-sm">
        {cart.lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-4">
            <span className="text-gray-600">
              {line.quantity} x {line.name}
            </span>
            <span className="whitespace-nowrap font-medium">
              {formatMoney(line.priceCents * line.quantity)}
            </span>
          </li>
        ))}
        {cart.lines.length === 0 ? (
          <li className="text-gray-500">Your basket is empty.</li>
        ) : null}
      </ul>

      {showShippingHint && remaining > 0 && cart.lines.length > 0 ? (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Spend {formatMoney(remaining)} more and delivery is free, anywhere in
          Nigeria.
        </p>
      ) : null}

      {zone ? (
        <p className="mb-4 rounded-md bg-rose-50/70 px-3 py-2 text-xs text-gray-700">
          Delivering to <strong>{zone.name}</strong> - {zone.description}.
        </p>
      ) : null}

      <dl className="space-y-2 border-t border-rose-50 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">Subtotal</dt>
          <dd>{formatMoney(cart.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Delivery</dt>
          <dd>
            {!shippingKnown ? (
              <span className="text-gray-500">Calculated at checkout</span>
            ) : cart.shippingCents === 0 ? (
              <span className="font-medium text-emerald-700">Free</span>
            ) : (
              formatMoney(cart.shippingCents ?? 0)
            )}
          </dd>
        </div>
        <div className="flex justify-between border-t border-rose-50 pt-3 text-base font-semibold">
          <dt>Total</dt>
          <dd>
            {shippingKnown ? (
              formatMoney(cart.totalCents)
            ) : (
              <>
                {formatMoney(cart.subtotalCents)}
                <span className="ml-1 text-xs font-normal text-gray-500">
                  + delivery
                </span>
              </>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}