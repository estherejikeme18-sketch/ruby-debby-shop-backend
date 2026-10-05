import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a1538]">
        Ruby Debby Fashion Home
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-gray-600">
        That page or product does not exist. It may have been removed.
      </p>
      <Link
        href="/"
        className="inline-block rounded-md bg-[#8a1538] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#6d0f2b]"
      >
        Back to the shop
      </Link>
    </div>
  );
}