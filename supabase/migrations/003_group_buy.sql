-- Migration 003: 공동구매 (Group Buy)
-- Safe to re-run.

-- ============ group_buys table ============
create table if not exists public.group_buys (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  group_price integer not null check (group_price >= 0),
  target_quantity integer not null check (target_quantity > 0),
  max_per_user integer not null default 1 check (max_per_user > 0),
  start_at timestamptz not null default now(),
  end_at timestamptz not null,
  status text not null default 'open' check (status in ('open','success','failed','cancelled')),
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists group_buys_product_idx on public.group_buys (product_id);
create index if not exists group_buys_seller_idx on public.group_buys (seller_id);
create index if not exists group_buys_status_end_idx on public.group_buys (status, end_at desc);

-- ============ order_items: link to group buy ============
alter table public.order_items add column if not exists group_buy_id uuid
  references public.group_buys(id) on delete set null;
create index if not exists order_items_group_buy_idx on public.order_items (group_buy_id);

-- ============ updated_at trigger ============
drop trigger if exists group_buys_set_updated_at on public.group_buys;
create trigger group_buys_set_updated_at
before update on public.group_buys
for each row execute function public.set_updated_at();

-- ============ RLS ============
alter table public.group_buys enable row level security;

-- Anyone can read group_buys (public listing) — RLS still restricts product access if status='inactive'.
drop policy if exists "group_buys public read" on public.group_buys;
create policy "group_buys public read" on public.group_buys for select using (true);

-- Seller manages own
drop policy if exists "group_buys seller insert" on public.group_buys;
create policy "group_buys seller insert" on public.group_buys for insert
  with check (
    auth.uid() = seller_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
    and exists (select 1 from public.products pr where pr.id = product_id and pr.seller_id = auth.uid())
  );

drop policy if exists "group_buys seller update" on public.group_buys;
create policy "group_buys seller update" on public.group_buys for update
  using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "group_buys seller delete" on public.group_buys;
create policy "group_buys seller delete" on public.group_buys for delete using (auth.uid() = seller_id);

-- Admin
drop policy if exists "group_buys admin all" on public.group_buys;
create policy "group_buys admin all" on public.group_buys for all using (public.is_admin()) with check (public.is_admin());

-- ============ Helper: current paid quantity for a group buy ============
create or replace function public.group_buy_current_quantity(gb_id uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select coalesce(sum(oi.quantity), 0)::integer
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.group_buy_id = gb_id and o.status = 'paid';
$$;
