-- ============================================================================
--  Ruby Debby Fashion Home - SYNCED CART migration
--
--  Run this ONCE in Supabase SQL Editor (after schema.sql).
--  It adds the shared cart table that the WEBSITE and the MOBILE APP
--  both read and write, so the cart syncs in both directions for the
--  same signed-in account.
--
--  Safe to run more than once (all statements are IF NOT EXISTS / drop-if).
-- ============================================================================

create table if not exists public.cart_items (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity   integer not null check (quantity > 0 and quantity <= 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists cart_items_user_id_idx
  on public.cart_items (user_id);

alter table public.cart_items enable row level security;

-- A customer can only see and touch their OWN cart rows.
drop policy if exists "Customers manage their own cart" on public.cart_items;
create policy "Customers manage their own cart"
  on public.cart_items
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
