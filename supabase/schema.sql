-- ============================================================================
--  Ruby Debby Fashion Home - Supabase database schema
--
--  HOW TO USE THIS FILE
--    1. Open your project at https://supabase.com
--    2. In the left sidebar click "SQL Editor", then "New query"
--    3. Paste this ENTIRE file and click "Run"
--
--  It is safe to run more than once. Every statement either uses
--  "if not exists" or drops the policy before recreating it, and the sample
--  products are matched by slug so re-running does not duplicate them.
-- ============================================================================

create extension if not exists pgcrypto;


-- ----------------------------------------------------------------------------
--  products - the collection shown in the shop
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,          -- used in the URL: /products/adire-wrap-dress
  name         text not null,
  description  text,
  category     text,                          -- "Dresses", "Bags", "Shoes", "Accessories"
  -- Money is stored as WHOLE KOBO (the minor unit of the Naira), never as a
  -- decimal like 45000.00, so totals stay exact.
  -- 4500000 in this column displays as N45,000.00 in the shop.
  price_cents  integer not null check (price_cents >= 0),
  image_url    text,
  stock        integer not null default 0 check (stock >= 0),
  is_active    boolean not null default true, -- false hides it from the shop
  created_at   timestamptz not null default now()
);

create index if not exists products_category_idx
  on public.products (category);


-- ----------------------------------------------------------------------------
--  orders - one row per checkout
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,     -- shown to the customer, e.g. RDF-20261002-4F7A
  -- Links the order to a signed-in customer. "on delete set null" means the
  -- order survives even if that account is later deleted.
  user_id           uuid references auth.users (id) on delete set null,
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text,
  shipping_address  text not null,
  city              text not null,
  -- The Nigerian state the parcel is going to. The delivery fee is worked out
  -- from this, so it is stored alongside the order.
  shipping_state    text,
  postcode          text not null,
  country           text not null,
  delivery_notes    text,
  subtotal_cents    integer not null check (subtotal_cents >= 0),
  shipping_cents    integer not null default 0 check (shipping_cents >= 0),
  total_cents       integer not null check (total_cents >= 0),
  status            text not null default 'paid',  -- paid, packed, shipped, delivered
  created_at        timestamptz not null default now()
);

create index if not exists orders_customer_email_idx
  on public.orders (lower(customer_email));
create index if not exists orders_user_id_idx
  on public.orders (user_id);
create index if not exists orders_created_at_idx
  on public.orders (created_at desc);


-- ----------------------------------------------------------------------------
--  order_items - the lines inside each order
--
--  The product name and price are COPIED in here on purpose. If you later
--  rename a product or change its price, old receipts must not change with it.
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  product_name      text not null,
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  quantity          integer not null check (quantity > 0)
);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);


-- ============================================================================
--  Additions for shops that already ran an earlier version of this file
--
--  "add column if not exists" does nothing if the column is already there, so
--  these lines are safe whether this is your first run or your fifth.
-- ============================================================================

-- The state a parcel is going to, added when state-based delivery was
-- introduced. Delivery fees are worked out from this.
alter table public.orders
  add column if not exists shipping_state text;

-- The category, used by the filter on the homepage.
alter table public.products
  add column if not exists category text;


-- ============================================================================
--  Row Level Security (RLS)
--
--  Supabase publishes your tables over the internet. Anyone who has the public
--  anon key - which ships inside the browser bundle - can send queries. Without
--  RLS, that key could read every order in the shop.
--
--  The plan:
--    products    -> readable by everybody, writable by nobody
--    orders      -> readable ONLY by the customer who placed the order
--    order_items -> readable only when the parent order is yours
--
--  Checkout writes new orders using the service_role key, which bypasses these
--  policies. That is why a customer never needs write access to `orders`, and
--  why the service_role key must stay on the server.
-- ============================================================================

alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;


-- ---- products: everyone can look, nobody can change ----
drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);


-- ---- orders: only your own ----
drop policy if exists "Customers can read their own orders" on public.orders;
create policy "Customers can read their own orders"
  on public.orders
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or lower(customer_email) = lower((select auth.jwt() ->> 'email'))
  );


-- ---- order_items: only the lines of your own orders ----
drop policy if exists "Customers can read their own order items" on public.order_items;
create policy "Customers can read their own order items"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (
          o.user_id = (select auth.uid())
          or lower(o.customer_email) = lower((select auth.jwt() ->> 'email'))
        )
    )
  );


-- ============================================================================
--  The sample collection
--
--  Matched by slug with "on conflict do update", so running this file twice
--  refreshes the details instead of creating duplicates.
--
--  To add your own products: copy one block, change the slug to something new,
--  and set the price in kobo (4500000 displays as N45,000.00).
-- ============================================================================

insert into public.products
  (slug, name, description, category, price_cents, image_url, stock)
values
  (
    'adire-wrap-dress',
    'Adire Wrap Dress',
    'Hand-dyed adire cotton in a flattering wrap cut. Ties at the waist, falls just below the knee.',
    'Dresses',
    4500000,
    'https://picsum.photos/seed/adire-wrap-dress/900/900',
    14
  ),
  (
    'ankara-midi-dress',
    'Ankara Print Midi Dress',
    'Bold ankara print with a fitted bodice and a full midi skirt. Lined, with hidden pockets.',
    'Dresses',
    3200000,
    'https://picsum.photos/seed/ankara-midi-dress/900/900',
    20
  ),
  (
    'leather-tote',
    'Structured Leather Tote',
    'Full-grain leather that softens with use. Fits a 14 inch laptop, with a zip pocket inside.',
    'Bags',
    5800000,
    'https://picsum.photos/seed/leather-tote-bag/900/900',
    9
  ),
  (
    'block-heel-sandals',
    'Block Heel Sandals',
    'A 6cm block heel you can actually walk in. Cushioned insole, adjustable ankle strap.',
    'Shoes',
    2800000,
    'https://picsum.photos/seed/block-heel-sandals/900/900',
    18
  ),
  (
    'silk-head-wrap',
    'Silk Head Wrap',
    'Long enough for a tall wrap, soft enough to sleep in. Hand-rolled hem.',
    'Accessories',
    950000,
    'https://picsum.photos/seed/silk-head-wrap/900/900',
    40
  ),
  (
    'gold-statement-earrings',
    'Gold Statement Earrings',
    'Lightweight gold-plated brass. Big enough to finish an outfit, light enough for all day.',
    'Accessories',
    1400000,
    'https://picsum.photos/seed/gold-earrings/900/900',
    35
  ),
  (
    'linen-blazer',
    'Tailored Linen Blazer',
    'A relaxed single-breasted blazer in breathable linen. Half-lined, so it stays cool.',
    'Outerwear',
    6500000,
    'https://picsum.photos/seed/linen-blazer/900/900',
    7
  ),
  (
    'cashmere-scarf',
    'Cashmere-Blend Scarf',
    'Warm without the bulk. A generous 200cm, so it doubles as a wrap on cool evenings.',
    'Accessories',
    1800000,
    'https://picsum.photos/seed/cashmere-scarf/900/900',
    26
  )
on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      category    = excluded.category,
      price_cents = excluded.price_cents,
      image_url   = excluded.image_url,
      stock       = excluded.stock,
      is_active   = true;


-- To check your work, run:
--   select slug, name, category, price_cents, stock from public.products order by created_at;