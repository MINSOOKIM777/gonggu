-- Group-Buy Platform Schema for Supabase
-- Paste into Supabase SQL Editor and run.

-- ============ Tables ============

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer','supplier','influencer')) default 'customer',
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- 공급자 추가 정보
create table if not exists public.suppliers (
  id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null,
  business_number text,
  settlement_bank text,
  settlement_account text,
  created_at timestamptz not null default now()
);

-- 인플루언서 추가 정보
create table if not exists public.influencers (
  id uuid primary key references public.profiles(id) on delete cascade,
  handle text unique not null,               -- URL slug: /g/[handle]
  bio text,
  instagram_url text,
  youtube_url text,
  tiktok_url text,
  blog_url text,
  other_url text,
  settlement_bank text,
  settlement_account text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text unique not null
);

-- 공급자가 등록하는 상품
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.profiles(id) on delete cascade,
  category_id bigint references public.categories(id) on delete set null,
  name text not null,
  description text,
  price integer not null check (price >= 0),
  compare_at_price integer,
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  image_urls text[] not null default '{}',
  commission_rate numeric(5,4) not null default 0.10 check (commission_rate >= 0 and commission_rate < 1),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_supplier_idx on public.products (supplier_id);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status, created_at desc);

-- 인플루언서가 상품 판매 신청
create table if not exists public.group_buy_applications (
  id bigint generated always as identity primary key,
  influencer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (influencer_id, product_id)
);
create index if not exists applications_influencer_idx on public.group_buy_applications (influencer_id);
create index if not exists applications_product_idx on public.group_buy_applications (product_id);
create index if not exists applications_status_idx on public.group_buy_applications (status);

-- 승인 후 인플루언서가 만드는 공동구매
create table if not exists public.group_buys (
  id uuid primary key default gen_random_uuid(),
  application_id bigint references public.group_buy_applications(id) on delete set null,
  influencer_id uuid not null references public.profiles(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  title text not null,
  description text,
  group_price integer not null check (group_price >= 0),
  target_quantity integer not null check (target_quantity > 0),
  max_per_user integer not null default 10 check (max_per_user > 0),
  start_at timestamptz not null default now(),
  end_at timestamptz not null,
  status text not null default 'open' check (status in ('open','closed','success','failed','cancelled')),
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists group_buys_influencer_idx on public.group_buys (influencer_id);
create index if not exists group_buys_product_idx on public.group_buys (product_id);
create index if not exists group_buys_status_idx on public.group_buys (status, end_at asc);

-- 배송지 목록
create table if not exists public.shipping_addresses (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  recipient_name text not null,
  recipient_phone text not null,
  address text not null,
  address_detail text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists shipping_addresses_customer_idx on public.shipping_addresses (customer_id, created_at desc);

-- 주문
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  group_buy_id uuid references public.group_buys(id) on delete set null,
  toss_order_id text unique not null,
  toss_payment_key text,
  status text not null default 'pending' check (status in ('pending','paid','cancelled','failed')),
  total_amount integer not null,
  commission_total integer not null default 0,
  recipient_name text not null,
  recipient_phone text not null,
  address text not null,
  address_detail text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancelled_by text check (cancelled_by in ('customer','supplier','system'))
);
create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_group_buy_idx on public.orders (group_buy_id);

-- 주문 항목
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  group_buy_id uuid references public.group_buys(id) on delete set null,
  product_id uuid not null references public.products(id) on delete restrict,
  supplier_id uuid not null references public.profiles(id) on delete restrict,
  influencer_id uuid references public.profiles(id) on delete set null,
  product_name text not null,
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  commission_rate numeric(5,4) not null,
  commission_amount integer not null,
  subtotal integer not null,
  delivery_status text not null default 'ready' check (delivery_status in ('ready','shipped','delivered','cancelled')),
  shipped_at timestamptz,
  delivered_at timestamptz
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_supplier_idx on public.order_items (supplier_id);
create index if not exists order_items_influencer_idx on public.order_items (influencer_id);

-- 정산
create table if not exists public.settlements (
  id bigint generated always as identity primary key,
  beneficiary_id uuid not null references public.profiles(id) on delete restrict,
  beneficiary_type text not null check (beneficiary_type in ('supplier','influencer')),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id bigint not null references public.order_items(id) on delete cascade,
  gross_amount integer not null,
  commission_amount integer not null,
  payout_amount integer not null,
  status text not null default 'pending' check (status in ('pending','paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists settlements_beneficiary_idx on public.settlements (beneficiary_id, created_at desc);

-- ============ Trigger: auto-create profile on signup ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ updated_at trigger ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists group_buys_updated_at on public.group_buys;
create trigger group_buys_updated_at before update on public.group_buys
for each row execute function public.set_updated_at();

drop trigger if exists applications_updated_at on public.group_buy_applications;
create trigger applications_updated_at before update on public.group_buy_applications
for each row execute function public.set_updated_at();

-- ============ RPC: 공동구매 현재 수량 ============
create or replace function public.group_buy_current_quantity(gb_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(sum(oi.quantity), 0)::integer
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.group_buy_id = gb_id
    and o.status in ('paid', 'pending');
$$;

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.influencers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.group_buy_applications enable row level security;
alter table public.group_buys enable row level security;
alter table public.shipping_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settlements enable row level security;

-- profiles
drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles public influencer read" on public.profiles;
create policy "profiles public influencer read" on public.profiles for select
  using (role = 'influencer');

-- suppliers
drop policy if exists "suppliers self all" on public.suppliers;
create policy "suppliers self all" on public.suppliers for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- influencers: handle/bio/channels 공개
drop policy if exists "influencers public read" on public.influencers;
create policy "influencers public read" on public.influencers for select using (true);
drop policy if exists "influencers self write" on public.influencers;
create policy "influencers self write" on public.influencers for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- categories
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);

-- products
drop policy if exists "products public read active" on public.products;
create policy "products public read active" on public.products for select
  using (status = 'active' or supplier_id = auth.uid());

drop policy if exists "products supplier insert" on public.products;
create policy "products supplier insert" on public.products for insert
  with check (
    auth.uid() = supplier_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'supplier')
  );

drop policy if exists "products supplier update" on public.products;
create policy "products supplier update" on public.products for update
  using (auth.uid() = supplier_id) with check (auth.uid() = supplier_id);

drop policy if exists "products supplier delete" on public.products;
create policy "products supplier delete" on public.products for delete using (auth.uid() = supplier_id);

-- group_buy_applications
drop policy if exists "applications influencer own" on public.group_buy_applications;
create policy "applications influencer own" on public.group_buy_applications for all
  using (auth.uid() = influencer_id) with check (auth.uid() = influencer_id);

drop policy if exists "applications supplier read" on public.group_buy_applications;
create policy "applications supplier read" on public.group_buy_applications for select
  using (
    exists (
      select 1 from public.products pr
      where pr.id = product_id and pr.supplier_id = auth.uid()
    )
  );

drop policy if exists "applications supplier update" on public.group_buy_applications;
create policy "applications supplier update" on public.group_buy_applications for update
  using (
    exists (
      select 1 from public.products pr
      where pr.id = product_id and pr.supplier_id = auth.uid()
    )
  );

-- group_buys
drop policy if exists "group_buys public read" on public.group_buys;
create policy "group_buys public read" on public.group_buys for select
  using (
    status = 'open'
    or influencer_id = auth.uid()
    or exists (
      select 1 from public.products pr
      where pr.id = product_id and pr.supplier_id = auth.uid()
    )
  );

drop policy if exists "group_buys influencer insert" on public.group_buys;
create policy "group_buys influencer insert" on public.group_buys for insert
  with check (
    auth.uid() = influencer_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'influencer')
  );

drop policy if exists "group_buys influencer update" on public.group_buys;
create policy "group_buys influencer update" on public.group_buys for update
  using (auth.uid() = influencer_id);

-- orders
drop policy if exists "orders customer select" on public.orders;
create policy "orders customer select" on public.orders for select using (auth.uid() = customer_id);

drop policy if exists "orders supplier read via items" on public.orders;
create policy "orders supplier read via items" on public.orders for select
  using (exists (
    select 1 from public.order_items oi
    where oi.order_id = orders.id and oi.supplier_id = auth.uid()
  ));

drop policy if exists "orders influencer read via items" on public.orders;
create policy "orders influencer read via items" on public.orders for select
  using (exists (
    select 1 from public.order_items oi
    where oi.order_id = orders.id and oi.influencer_id = auth.uid()
  ));

drop policy if exists "orders customer insert" on public.orders;
create policy "orders customer insert" on public.orders for insert with check (auth.uid() = customer_id);

drop policy if exists "orders customer update" on public.orders;
create policy "orders customer update" on public.orders for update using (auth.uid() = customer_id);

-- order_items
drop policy if exists "order_items customer select" on public.order_items;
create policy "order_items customer select" on public.order_items for select
  using (exists (
    select 1 from public.orders o where o.id = order_items.order_id and o.customer_id = auth.uid()
  ));

drop policy if exists "order_items supplier select" on public.order_items;
create policy "order_items supplier select" on public.order_items for select using (supplier_id = auth.uid());

drop policy if exists "order_items influencer select" on public.order_items;
create policy "order_items influencer select" on public.order_items for select using (influencer_id = auth.uid());

drop policy if exists "order_items customer insert" on public.order_items;
create policy "order_items customer insert" on public.order_items for insert
  with check (exists (
    select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()
  ));

-- shipping_addresses
drop policy if exists "shipping_addresses self" on public.shipping_addresses;
create policy "shipping_addresses self" on public.shipping_addresses for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- settlements
drop policy if exists "settlements beneficiary select" on public.settlements;
create policy "settlements beneficiary select" on public.settlements for select
  using (beneficiary_id = auth.uid());

-- ============ Seed categories ============
insert into public.categories (name, slug) values
  ('식품', 'food'),
  ('생활용품', 'household'),
  ('패션', 'fashion'),
  ('전자제품', 'electronics'),
  ('도서', 'books'),
  ('뷰티', 'beauty')
on conflict (slug) do nothing;
