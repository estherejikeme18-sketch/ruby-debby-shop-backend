"use client";

import { useState } from "react";
import { emailSignInAction, emailSignUpAction } from "./email-actions";

/**
 * Email + password sign-in / sign-up.
 *
 * Google OAuth cannot run inside the mobile app without extra native setup,
 * so this is the login the DEMO VIDEO uses: the SAME email + password works
 * on the website AND in the mobile app (both talk to the same Supabase
 * project), which is what makes the two-way cart sync possible.
 */
export default function EmailAuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const result =
        mode === "signin"
          ? await emailSignInAction(formData)
          : await emailSignUpAction(formData);
      setMessage(result.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 border-t border-rose-100 pt-6 text-left">
      <div className="mb-3 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-full px-4 py-1.5 ${
            mode === "signin"
              ? "bg-[#8a1538] text-white"
              : "border border-gray-300"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-full px-4 py-1.5 ${
            mode === "signup"
              ? "bg-[#8a1538] text-white"
              : "border border-gray-300"
          }`}
        >
          New account
        </button>
      </div>

      <form action={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email-email" className="mb-1 block text-sm font-medium">
            Email address
          </label>
          <input
            id="email-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2.5"
          />
        </div>
        <div>
          <label
            htmlFor="email-password"
            className="mb-1 block text-sm font-medium"
          >
            Password
          </label>
          <input
            id="email-password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="At least 6 characters"
            className="w-full rounded-md border border-gray-300 px-3 py-2.5"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[#8a1538] px-4 py-3 font-medium text-white hover:bg-[#6d0f2b] disabled:opacity-50"
        >
          {pending
            ? "Please wait..."
            : mode === "signin"
              ? "Sign in with email"
              : "Create account"}
        </button>
      </form>

      {message ? (
        <p
          role="status"
          className="mt-3 rounded-md border border-rose-100 bg-rose-50/50 px-3 py-2 text-sm text-gray-700"
        >
          {message}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-gray-500">
        Use this same email + password in the mobile app - your cart syncs
        between both.
      </p>
    </div>
  );
}
