import Link from "next/link";

export const metadata = { title: "Order confirmed" };

type SearchParams = {
  order?: string;
  email?: string;
  saved?: string;
  mail?: string;
};

/** Friendly explanations for the status flags passed in the URL. */
function mailMessage(mail: string | undefined): { tone: string; text: string } {
  if (mail === "sent") {
    return {
      tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      text: "A confirmation email is on its way to your inbox.",
    };
  }
  if (mail === "demo") {
    return {
      tone: "border-amber-200 bg-amber-50 text-amber-800",
      text: "Demo mode: no Mailgun keys are set, so the confirmation email was printed to your terminal instead of being sent.",
    };
  }
  return {
    tone: "border-red-200 bg-red-50 text-red-700",
    text: "Your order was saved, but the confirmation email could not be sent. Check your Mailgun settings.",
  };
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const orderNumber = params.order ?? "unknown";
  const mail = mailMessage(params.mail);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-rose-100 bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-2xl text-[#8a1538]">
          &#10003;
        </div>
        <h1 className="text-2xl font-semibold">Thank you, order confirmed</h1>
        <p className="mt-2 text-gray-600">
          Your order reference is{" "}
          <span className="font-mono font-semibold text-gray-900">
            {orderNumber}
          </span>
        </p>
        {params.email ? (
          <p className="mt-1 text-sm text-gray-500">
            A receipt has been prepared for {params.email}
          </p>
        ) : null}
      </div>

      <p className={`rounded-md border px-4 py-3 text-sm ${mail.tone}`}>
        {mail.text}
      </p>

      {params.saved === "demo" ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Demo mode: no <code>SUPABASE_SERVICE_ROLE_KEY</code> is set, so this
          order was logged to your terminal instead of being saved to the
          database. Add the key to <code>.env.local</code> and it will be stored.
        </p>
      ) : (
        <p className="rounded-md border border-rose-100 bg-white px-4 py-3 text-sm text-gray-600">
          This order and its items are stored in the <code>orders</code> and{" "}
          <code>order_items</code> tables in Supabase.
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-[#8a1538] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#6d0f2b]"
        >
          Continue shopping
        </Link>
        <Link
          href="/orders"
          className="rounded-md border border-[#8a1538] px-5 py-2.5 text-sm font-medium text-[#8a1538] hover:bg-rose-50"
        >
          View my orders
        </Link>
      </div>
    </div>
  );
}