-- ============================================================
-- Shop MVP — Supabase 전체 셋업 SQL
-- Supabase SQL Editor에 이 파일 전체를 붙여넣고 1회 실행.
-- (schema.sql + migrations/002_marketplace_features.sql 통합본)
-- ============================================================

-- ============ Tables ============

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer',
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('customer','seller','admin'));

create table if not exists public.sellers (
  id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null,
  business_number text,
  settlement_bank text,
  settlement_account text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text unique not null
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id bigint references public.categories(id) on delete set null,
  name text not null,
  description text,
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  commission_rate numeric(5,4) not null default 0.10 check (commission_rate >= 0 and commission_rate < 1),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products add column if not exists compare_at_price integer
  check (compare_at_price is null or compare_at_price >= 0);
alter table public.products add column if not exists image_urls jsonb not null default '[]'::jsonb;

create index if not exists products_seller_idx on public.products (seller_id);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status, created_at desc);

create table if not exists public.cart_items (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
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
  paid_at timestamptz
);
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists cancellation_reason text;
alter table public.orders add column if not exists cancelled_by text
  check (cancelled_by is null or cancelled_by in ('customer','seller','admin','system'));

create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  product_name text not null,
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  commission_rate numeric(5,4) not null,
  commission_amount integer not null,
  subtotal integer not null
);
alter table public.order_items add column if not exists delivery_status text not null default 'ready'
  check (delivery_status in ('ready','shipped','delivered','cancelled'));
alter table public.order_items add column if not exists shipped_at timestamptz;
alter table public.order_items add column if not exists delivered_at timestamptz;
alter table public.order_items add column if not exists tracking_number text;

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_seller_idx on public.order_items (seller_id);

create table if not exists public.settlements (
  id bigint generated always as identity primary key,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id bigint not null references public.order_items(id) on delete cascade,
  gross_amount integer not null,
  commission_amount integer not null,
  payout_amount integer not null,
  status text not null default 'pending' check (status in ('pending','paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists settlements_seller_idx on public.settlements (seller_id, created_at desc);

-- ============ Triggers ============

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

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ============ Helper: is_admin() ============

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============ RLS Enable ============

alter table public.profiles enable row level security;
alter table public.sellers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settlements enable row level security;

-- ============ profiles policies ============

drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "profiles admin select" on public.profiles;
create policy "profiles admin select" on public.profiles for select using (public.is_admin() or auth.uid() = id);

-- ============ sellers policies ============

drop policy if exists "sellers self all" on public.sellers;
create policy "sellers self all" on public.sellers for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "sellers admin select" on public.sellers;
create policy "sellers admin select" on public.sellers for select using (public.is_admin() or auth.uid() = id);

-- ============ categories policies ============

drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);

-- ============ products policies ============

drop policy if exists "products public read active" on public.products;
create policy "products public read active" on public.products for select
  using (status = 'active' or seller_id = auth.uid());

drop policy if exists "products seller insert" on public.products;
create policy "products seller insert" on public.products for insert
  with check (
    auth.uid() = seller_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
  );

drop policy if exists "products seller update" on public.products;
create policy "products seller update" on public.products for update
  using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "products seller delete" on public.products;
create policy "products seller delete" on public.products for delete using (auth.uid() = seller_id);

drop policy if exists "products admin all" on public.products;
create policy "products admin all" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- ============ cart_items policies ============

drop policy if exists "cart self all" on public.cart_items;
create policy "cart self all" on public.cart_items for all using (auth.uid() = customer_id) with check (auth.uid() = customer_id);

-- ============ orders policies ============

drop policy if exists "orders customer select" on public.orders;
create policy "orders customer select" on public.orders for select using (auth.uid() = customer_id);

drop policy if exists "orders seller select via items" on public.orders;
create policy "orders seller select via items" on public.orders for select
  using (exists (select 1 from public.order_items oi where oi.order_id = orders.id and oi.seller_id = auth.uid()));

drop policy if exists "orders customer insert" on public.orders;
create policy "orders customer insert" on public.orders for insert with check (auth.uid() = customer_id);

drop policy if exists "orders customer update" on public.orders;
create policy "orders customer update" on public.orders for update using (auth.uid() = customer_id);

drop policy if exists "orders admin select" on public.orders;
create policy "orders admin select" on public.orders for select using (public.is_admin());

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update using (public.is_admin());

-- ============ order_items policies ============

drop policy if exists "order_items customer select" on public.order_items;
create policy "order_items customer select" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.customer_id = auth.uid()));

drop policy if exists "order_items seller select" on public.order_items;
create policy "order_items seller select" on public.order_items for select using (seller_id = auth.uid());

drop policy if exists "order_items customer insert" on public.order_items;
create policy "order_items customer insert" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));

drop policy if exists "order_items seller update delivery" on public.order_items;
create policy "order_items seller update delivery" on public.order_items for update
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());

drop policy if exists "order_items admin select" on public.order_items;
create policy "order_items admin select" on public.order_items for select using (public.is_admin());

drop policy if exists "order_items admin update" on public.order_items;
create policy "order_items admin update" on public.order_items for update using (public.is_admin());

-- ============ settlements policies ============

drop policy if exists "settlements seller select" on public.settlements;
create policy "settlements seller select" on public.settlements for select using (seller_id = auth.uid());

drop policy if exists "settlements admin all" on public.settlements;
create policy "settlements admin all" on public.settlements for all using (public.is_admin()) with check (public.is_admin());

-- ============ Storage bucket: product-images ============

insert into storage.buckets (id, name, public)
  values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read" on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product-images seller insert" on storage.objects;
create policy "product-images seller insert" on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "product-images seller update" on storage.objects;
create policy "product-images seller update" on storage.objects for update
  using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "product-images seller delete" on storage.objects;
create policy "product-images seller delete" on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============ 공동구매 (Group Buy) ============

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

alter table public.order_items add column if not exists group_buy_id uuid
  references public.group_buys(id) on delete set null;
create index if not exists order_items_group_buy_idx on public.order_items (group_buy_id);

drop trigger if exists group_buys_set_updated_at on public.group_buys;
create trigger group_buys_set_updated_at
before update on public.group_buys
for each row execute function public.set_updated_at();

alter table public.group_buys enable row level security;

drop policy if exists "group_buys public read" on public.group_buys;
create policy "group_buys public read" on public.group_buys for select using (true);

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

drop policy if exists "group_buys admin all" on public.group_buys;
create policy "group_buys admin all" on public.group_buys for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.group_buy_current_quantity(gb_id uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select coalesce(sum(oi.quantity), 0)::integer
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.group_buy_id = gb_id and o.status = 'paid';
$$;

-- ============ Seed: categories ============

insert into public.categories (name, slug) values
  ('식품', 'food'),
  ('생활용품', 'household'),
  ('패션', 'fashion'),
  ('전자제품', 'electronics'),
  ('도서', 'books'),
  ('뷰티', 'beauty')
on conflict (slug) do nothing;

-- ============ 끝 ============
-- 추가 단계:
-- 1) 위 SQL 실행 후 앱에서 회원가입(판매자/고객).
-- 2) 관리자로 만들고 싶은 사용자에 대해:
--    update public.profiles set role = 'admin' where id = 'YOUR_USER_ID';
-- 3) (선택) supabase/seed.sql 의 placeholder seller_id를 본인 판매자 UUID로 치환 후 실행하면 샘플 상품 18종 추가.
