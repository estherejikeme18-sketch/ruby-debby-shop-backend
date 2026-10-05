export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-rose-100 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-[#8a1538]">Ruby Debby</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
            Fashion Home
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Dresses, bags, shoes and accessories - chosen with care and
            delivered to your door.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">Shop</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <a href="/" className="hover:text-[#8a1538]">
                All products
              </a>
            </li>
            <li>
              <a href="/cart" className="hover:text-[#8a1538]">
                Your cart
              </a>
            </li>
            <li>
              <a href="/orders" className="hover:text-[#8a1538]">
                Track an order
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">Delivery</p>
          <p className="text-sm text-gray-600">
            We ship from Abuja. Delivery is priced by state - free on orders
            over N150,000.
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Abuja, Nigeria. Prices in Naira, delivery by state.
          </p>
        </div>
      </div>

      <div className="border-t border-rose-50 py-4 text-center text-xs text-gray-500">
        <p>
          &copy; {year} Ruby Debby Fashion Home. Built with Next.js, Supabase
          and Mailgun.
        </p>
      </div>
    </footer>
  );
}