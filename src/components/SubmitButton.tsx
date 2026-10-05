"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that disables itself while the server action is running, so
 * a customer cannot double-click and create two identical orders.
 */
export default function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "w-full rounded-md bg-[#8a1538] px-4 py-3 font-medium text-white hover:bg-[#6d0f2b] disabled:cursor-not-allowed disabled:bg-gray-400"
      }
    >
      {pending ? (pendingLabel ?? "Please wait...") : children}
    </button>
  );
}