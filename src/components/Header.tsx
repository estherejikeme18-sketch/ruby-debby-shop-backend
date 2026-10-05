import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { getCartItemCount } from "@/lib/cart";
import { isMailgunConfigured } from "@/lib/mailgun";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/** A small coloured dot showing whether an integration is switched on. */
function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-400"}`}
        aria-hidden="true"
      />
      <span>
        {label}: {ok ? "on" : "demo"}
      </span>
    </span>
  );
}

export default async function Header() {
  const itemCount = await getCartItemCount();

  let userEmail: string | null = null;
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    userEmail = data.user?.email ?? null;
  }

  const supabaseReady = isSupabaseConfigured();
  const databaseReady = supabaseReady && getSupabaseAdminClient() !== null;
  const mailReady = isMailgunConfigured();

  return (
    <header className="border-b border-rose-100 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="leading-tight">
          <span className="block text-lg font-semibold tracking-tight text-[#8a1538]">
            Ruby Debby
          </span>
          <span className="block text-[11px] uppercase tracking-[0.2em] text-gray-500">
            Fashion Home
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-[#8a1538]">
            Shop
          </Link>
          <Link href="/cart" className="hover:text-[#8a1538]">
            Cart
            <span className="ml-1 rounded-full bg-[#8a1538] px-2 py-0.5 text-xs text-white">
              {itemCount}
            </span>
          </Link>

          {userEmail ? (
            <>
              <Link href="/orders" className="hover:text-[#8a1538]">
                My orders
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-[#8a1538] px-3 py-1.5 text-[#8a1538] hover:bg-rose-50"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>

      {userEmail ? (
        <p className="mx-auto w-full max-w-6xl px-4 pb-2 text-xs text-gray-500">
          Signed in as {userEmail}
        </p>
      ) : null}

      <div className="border-t border-rose-50 bg-rose-50/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Setup status</span>
          <StatusDot ok={supabaseReady} label="Google login" />
          <StatusDot ok={databaseReady} label="Database" />
          <StatusDot ok={mailReady} label="Email" />
        </div>
      </div>
    </header>
  );
}