import { setDeliveryStateAction } from "@/app/actions";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import { calculateShipping, formatMoney } from "@/lib/money";
import { DELIVERY_ZONES, NIGERIA_STATES, zoneForState } from "@/lib/nigeria";

/**
 * "Where should we deliver?"
 *
 * Delivery in Nigeria depends on the state, so this has to be answered before
 * we can show a final total. Changing the dropdown submits this small form,
 * which saves the choice in a cookie, and the order summary next to it
 * re-renders with the correct fee.
 *
 * This is its own <form>, deliberately: HTML does not allow one form inside
 * another, and the state must be changeable without re-submitting the whole
 * checkout form.
 */
export default function DeliveryStatePicker({
  state,
  subtotalCents,
}: {
  state: string;
  subtotalCents: number;
}) {
  const zone = zoneForState(state);
  const fee = calculateShipping(subtotalCents, state);
  const isFree = fee === 0;

  return (
    <section className="rounded-lg border border-rose-100 bg-white p-5">
      <h2 className="mb-1 font-semibold">Where should we deliver?</h2>
      <p className="mb-4 text-sm text-gray-600">
        Delivery is priced by state, because we ship from Abuja.
      </p>

      <form action={setDeliveryStateAction} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <label
            htmlFor="delivery-state"
            className="mb-1 block text-sm font-medium"
          >
            Delivery state
          </label>
          <AutoSubmitSelect
            id="delivery-state"
            name="state"
            defaultValue={state}
            options={NIGERIA_STATES}
          />
        </div>

        {/* Needed when JavaScript is off, since the dropdown cannot auto-submit. */}
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Update delivery
        </button>
      </form>

      {zone ? (
        <p className="mt-4 rounded-md bg-rose-50/70 px-3 py-2 text-sm text-gray-700">
          <strong>{zone.name}</strong> - {zone.description}.{" "}
          {isFree ? (
            <span className="font-medium text-emerald-700">
              Delivery is free on this order.
            </span>
          ) : (
            <>
              Delivery fee{" "}
              <strong>{fee === null ? "" : formatMoney(fee)}</strong>.
            </>
          )}
        </p>
      ) : null}

      {subtotalCents > 0 && subtotalCents < 15000000 ? (
        <details className="mt-4 text-xs text-gray-600">
          <summary className="cursor-pointer hover:text-[#8a1538]">
            See all delivery fees
          </summary>
          <ul className="mt-2 space-y-1">
            {DELIVERY_ZONES.map((item) => (
              <li key={item.name} className="flex justify-between gap-4">
                <span>{item.name}</span>
                <span className="font-medium">{formatMoney(item.feeCents)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-4 border-t border-rose-50 pt-1 font-medium text-emerald-700">
              <span>Free</span>
              <span>Orders over {formatMoney(15000000)}</span>
            </li>
          </ul>
        </details>
      ) : null}
    </section>
  );
}