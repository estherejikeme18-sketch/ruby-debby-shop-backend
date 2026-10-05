"use client";

import { useActionState } from "react";
import { placeOrderAction } from "@/app/checkout/actions";
import SubmitButton from "@/components/SubmitButton";
import { initialCheckoutState } from "@/lib/checkout-helpers";
import { DEFAULT_STATE } from "@/lib/nigeria";
import type { CustomerDetails } from "@/lib/types";
import { DEFAULT_COUNTRY } from "@/lib/validation";

type Field = {
  name: keyof CustomerDetails;
  label: string;
  autoComplete: string;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  full?: boolean;
  /** Render a dropdown instead of a text box. */
  kind?: "select";
  options?: readonly string[];
  /** Text shown as the first (empty) option of a dropdown. */
  emptyLabel?: string;
};

const fields: Field[] = [
  {
    name: "fullName",
    label: "Full name",
    autoComplete: "name",
    placeholder: "Ruby Debby",
  },
  {
    name: "email",
    label: "Email address",
    autoComplete: "email",
    type: "email",
    placeholder: "you@example.com",
  },
  {
    name: "phone",
    label: "Phone number",
    autoComplete: "tel",
    type: "tel",
    placeholder: "0803 000 0000",
    optional: true,
  },
  {
    name: "address",
    label: "Street address",
    autoComplete: "street-address",
    placeholder: "12 Gimbiya Street, Area 11",
    full: true,
  },
  {
    name: "city",
    label: "Town or city",
    autoComplete: "address-level2",
    placeholder: "Garki",
  },
  {
    name: "postcode",
    label: "Postcode",
    autoComplete: "postal-code",
    placeholder: "900103",
  },
  {
    name: "country",
    label: "Country",
    autoComplete: "country-name",
    placeholder: "Nigeria",
  },
];

/**
 * The checkout form.
 *
 * `useActionState` connects this form to the server action and gives us back
 * the result: either validation errors to show, or - because the action
 * redirects on success - the customer is already on the confirmation page.
 */
export default function CheckoutForm({
  defaultEmail = "",
  state = DEFAULT_STATE,
}: {
  defaultEmail?: string;
  /** The state chosen in the delivery picker; sent with the order. */
  state?: string;
}) {
  const [actionState, formAction] = useActionState(
    placeOrderAction,
    initialCheckoutState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/*
        The delivery state was chosen in the picker above and saved in a cookie.
        It travels with the order as a hidden field so the server can work out
        the delivery fee from the validated value.
      */}
      <input type="hidden" name="state" value={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const submitted = actionState.values[field.name];
          /**
           * Nothing to pre-fill, unless: they are signed in (so we know their
           * email), or it is the country field, because the shop is in Nigeria.
           */
          const fallback =
            field.name === "email"
              ? defaultEmail
              : field.name === "country"
                ? DEFAULT_COUNTRY
                : "";
          const value = submitted ?? fallback;
          const error = actionState.errors[field.name];
          const errorId = `${field.name}-error`;

          return (
            <div
              key={field.name}
              className={field.full ? "sm:col-span-2" : undefined}
            >
              <label
                htmlFor={field.name}
                className="mb-1 block text-sm font-medium"
              >
                {field.label}
                {field.optional ? (
                  <span className="font-normal text-gray-400"> (optional)</span>
                ) : null}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                defaultValue={value}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8a1538]/30 ${
                  error ? "border-red-400 bg-red-50" : "border-gray-300"
                }`}
              />
              {error ? (
                <p id={errorId} className="mt-1 text-xs text-red-600">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="mb-1 block text-sm font-medium">
            Delivery notes
            <span className="font-normal text-gray-400"> (optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Gate colour, landmark, best time to deliver..."
            defaultValue={actionState.values.notes ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8a1538]/30"
          />
        </div>
      </div>

      {actionState.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {actionState.message}
        </p>
      ) : null}

      <p className="rounded-md bg-rose-50/60 px-3 py-2 text-xs text-gray-600">
        Training project: no card details are collected and no money is taken.
        Placing this order saves it to the database and emails a receipt.
      </p>

      <SubmitButton pendingLabel="Placing your order...">
        Place order
      </SubmitButton>
    </form>
  );
}