# DB 스키마

Supabase SQL Editor에 `supabase/schema.sql`을 붙여넣어 실행.

## 테이블

### `profiles` (auth.users 1:1 확장)
- `id` uuid PK references auth.users(id) on delete cascade
- `role` text not null check in ('customer','seller') default 'customer'
- `name` text not null
- `phone` text
- `created_at` timestamptz default now()

### `sellers` (판매자 추가 정보)
- `id` uuid PK references profiles(id) on delete cascade
- `business_name` text not null
- `business_number` text
- `settlement_bank` text
- `settlement_account` text
- `created_at` timestamptz default now()

### `categories`
- `id` bigint identity PK
- `name` text not null
- `slug` text unique not null

### `products`
- `id` uuid PK default gen_random_uuid()
- `seller_id` uuid not null references profiles(id) on delete cascade
- `category_id` bigint references categories(id) on delete set null
- `name` text not null
- `description` text
- `price` integer not null check (price >= 0)   -- 원 단위
- `stock` integer not null default 0 check (stock >= 0)
- `image_url` text
- `commission_rate` numeric(5,4) not null default 0.10 check (commission_rate >= 0 and commission_rate < 1)
- `status` text not null default 'active' check (status in ('active','inactive'))
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

인덱스: `(seller_id)`, `(category_id)`, `(status, created_at desc)`

### `cart_items`
- `id` bigint identity PK
- `customer_id` uuid not null references profiles(id) on delete cascade
- `product_id` uuid not null references products(id) on delete cascade
- `quantity` integer not null check (quantity > 0)
- `created_at` timestamptz default now()
- UNIQUE(customer_id, product_id)

### `orders`
- `id` uuid PK default gen_random_uuid()
- `customer_id` uuid not null references profiles(id) on delete restrict
- `toss_order_id` text unique not null   -- 토스에 전달하는 orderId
- `toss_payment_key` text                 -- 결제 확정 후 저장
- `status` text not null default 'pending' check (status in ('pending','paid','cancelled','failed'))
- `total_amount` integer not null         -- 결제 총액
- `commission_total` integer not null default 0
- `recipient_name` text not null
- `recipient_phone` text not null
- `address` text not null
- `address_detail` text
- `created_at` timestamptz default now()
- `paid_at` timestamptz

### `order_items`
- `id` bigint identity PK
- `order_id` uuid not null references orders(id) on delete cascade
- `product_id` uuid not null references products(id) on delete restrict
- `seller_id` uuid not null references profiles(id) on delete restrict
- `product_name` text not null    -- 스냅샷
- `unit_price` integer not null   -- 스냅샷
- `quantity` integer not null check (quantity > 0)
- `commission_rate` numeric(5,4) not null
- `commission_amount` integer not null   -- 행 단위 수수료 합계 (unit_price*quantity*rate, 반올림)
- `subtotal` integer not null            -- unit_price * quantity

### `settlements`
- `id` bigint identity PK
- `seller_id` uuid not null references profiles(id) on delete restrict
- `order_id` uuid not null references orders(id) on delete cascade
- `order_item_id` bigint not null references order_items(id) on delete cascade
- `gross_amount` integer not null   -- 판매가 합계
- `commission_amount` integer not null
- `payout_amount` integer not null  -- gross - commission
- `status` text not null default 'pending' check (status in ('pending','paid'))
- `created_at` timestamptz default now()
- `paid_at` timestamptz

## 트리거
- `auth.users` INSERT 시 `profiles` row 자동 생성 (raw_user_meta_data에서 role/name/phone 읽음). 함수 `handle_new_user`.

## RLS 정책 요약
- `profiles`: 본인만 SELECT/UPDATE 가능. INSERT는 트리거가 service_role로 수행.
- `sellers`: 본인 row만 SELECT/INSERT/UPDATE.
- `categories`: 누구나 SELECT. 쓰기는 service_role만 (MVP는 seed로 채움).
- `products`:
  - SELECT: `status='active'`이면 누구나, 자기 상품은 본인이 항상 SELECT.
  - INSERT/UPDATE/DELETE: `auth.uid() = seller_id` AND profiles.role = 'seller'.
- `cart_items`: `auth.uid() = customer_id` 본인만 전부.
- `orders`: 본인(customer_id)만 SELECT/INSERT/UPDATE. 판매자는 자기 상품이 포함된 주문은 SELECT 가능 (order_items join).
- `order_items`:
  - SELECT: 본인 주문이거나 자기 상품 판매자.
  - INSERT: 본인 주문에 한해.
- `settlements`: `auth.uid() = seller_id`만 SELECT.

> 주의: 결제 confirm/재고 차감/정산 INSERT 같이 RLS를 우회해야 하는 작업은 서버 라우트에서 `SUPABASE_SERVICE_ROLE_KEY`로 별도 클라이언트를 만들어 수행.
