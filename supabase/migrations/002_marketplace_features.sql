-- Migration 002: 마켓플레이스 흐름 완성 + 관리자 + 할인가 + 이미지 업로드
-- Safe to re-run.

-- ============ profiles: add 'admin' role ============
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('customer','seller','admin'));

-- ============ products: discount + multi-image ============
alter table public.products add column if not exists compare_at_price integer
  check (compare_at_price is null or compare_at_price >= 0);

-- 단일 image_url은 그대로 유지(대표 이미지). 추가 이미지는 image_urls jsonb로.
alter table public.products add column if not exists image_urls jsonb not null default '[]'::jsonb;

-- ============ orders: cancellation ============
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists cancellation_reason text;
alter table public.orders add column if not exists cancelled_by text
  check (cancelled_by is null or cancelled_by in ('customer','seller','admin','system'));

-- ============ order_items: per-item delivery status ============
alter table public.order_items add column if not exists delivery_status text not null default 'ready'
  check (delivery_status in ('ready','shipped','delivered','cancelled'));
alter table public.order_items add column if not exists shipped_at timestamptz;
alter table public.order_items add column if not exists delivered_at timestamptz;
alter table public.order_items add column if not exists tracking_number text;

-- ============ helper: is_admin() ============
create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============ Admin RLS overrides ============
drop policy if exists "products admin all" on public.products;
create policy "products admin all" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders admin select" on public.orders;
create policy "orders admin select" on public.orders for select using (public.is_admin());

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update using (public.is_admin());

drop policy if exists "order_items admin select" on public.order_items;
create policy "order_items admin select" on public.order_items for select using (public.is_admin());

drop policy if exists "order_items admin update" on public.order_items;
create policy "order_items admin update" on public.order_items for update using (public.is_admin());

drop policy if exists "settlements admin all" on public.settlements;
create policy "settlements admin all" on public.settlements for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles admin select" on public.profiles;
create policy "profiles admin select" on public.profiles for select using (public.is_admin() or auth.uid() = id);

drop policy if exists "sellers admin select" on public.sellers;
create policy "sellers admin select" on public.sellers for select using (public.is_admin() or auth.uid() = id);

-- ============ Seller can update own order_items (배송 처리) ============
drop policy if exists "order_items seller update delivery" on public.order_items;
create policy "order_items seller update delivery" on public.order_items for update
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());

-- ============ Storage bucket: product-images ============
insert into storage.buckets (id, name, public)
  values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- public read
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read" on storage.objects for select
  using (bucket_id = 'product-images');

-- sellers can upload/update/delete their own files (path prefix = uid)
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
