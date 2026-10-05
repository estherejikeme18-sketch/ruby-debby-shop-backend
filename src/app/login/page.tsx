import Link from "next/link";
import { signInWithGoogleAction } from "@/app/actions";
import EmailAuthForm from "./EmailAuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Sign in" };

/** Turns an ?error= code from the callback into something readable. */
function errorMessage(code: string): string | null {
  if (code === "supabase-not-configured") {
    return "Supabase is not configured yet, so sign-in is switched off. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";
  }
  if (code === "missing-code") {
    return "Google did not send an authorization code back. Please try signing in again.";
  }
  return code;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const message = params.error ? errorMessage(params.error) : null;

  return (
    <div className="mx-auto max-w-md space-y-6 py-6">
      <div className="rounded-lg border border-rose-100 bg-white p-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a1538]">
          Ruby Debby Fashion Home
        </p>
        <h1 className="mt-2 text-xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to sync your cart between the website and the mobile app.
        </p>

        {message ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700"
          >
            {message}
          </p>
        ) : null}

        <form action={signInWithGoogleAction} className="mt-6">
          <button
            type="submit"
            disabled={!configured}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 px-4 py-3 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.55-5.17 3.55-8.87Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Email login: SAME account works in the mobile app (demo video). */}
        <EmailAuthForm />

        {!configured ? (
          <p className="mt-4 text-left text-xs text-amber-700">
            Add your Supabase URL and anon key to <code>.env.local</code>, then
            switch on the Google provider in the Supabase dashboard to enable
            this button.
          </p>
        ) : null}
      </div>

      <p className="text-center text-sm">
        <Link href="/" className="hover:text-[#8a1538]">
          &larr; Back to the shop
        </Link>
      </p>
    </div>
  );
}
