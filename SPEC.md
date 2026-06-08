# Shop MVP - 쿠팡 스타일 마켓플레이스

## 개요
판매자(seller)와 고객(customer)을 매개하는 마켓플레이스. 플랫폼은 거래액 기준 수수료를 가져간다.

## 기술 스택
- **Frontend/Backend**: Next.js 16.2.6 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn 스타일 수동 컴포넌트 (Radix 없이 단순 구현)
- **DB/Auth/Storage**: Supabase
- **결제**: 토스페이먼츠 (`@tosspayments/payment-sdk`)
- **아이콘**: lucide-react

## 핵심 컨셉
- **수수료**: 기본 10%. `products.commission_rate` 컬럼으로 상품별 오버라이드 가능.
- **수수료 계산 시점**: 주문 생성 시점에 `order_items.commission_rate`로 스냅샷 저장.
- **결제 흐름**:
  1. 고객이 체크아웃 → 서버가 `orders` row를 `pending` 상태로 생성 (`toss_order_id` = UUID 생성)
  2. 토스 결제창 호출 → 결제 성공 시 success URL로 콜백 (paymentKey, orderId, amount 쿼리스트링)
  3. 서버에서 `/api/payments/confirm` 호출 → 토스 confirm API 호출 → 성공 시 `orders.status = 'paid'`, 재고 차감, 수수료 row 계산
  4. 판매자별 정산 row를 `settlements`에 `pending` 상태로 생성

## 사용자 역할
- `customer` (기본): 상품 조회, 장바구니, 주문, 결제, 주문 내역 조회
- `seller`: 위 모든 권한 + 자기 상품 CRUD, 자기 주문 조회, 정산 내역 조회

`/seller/*` 라우트는 미들웨어 또는 layout에서 role을 체크하여 보호.

## 디렉토리 구조
```
app/
  layout.tsx                    공통 레이아웃 + 헤더
  page.tsx                      홈 (배너 + 인기상품 그리드)
  globals.css
  (auth)/
    login/page.tsx
    signup/page.tsx
  products/
    page.tsx                    상품 목록 (검색/카테고리 필터)
    [id]/page.tsx               상품 상세
  cart/page.tsx                 장바구니
  checkout/
    page.tsx                    주문서 작성 + 토스 결제 호출
    success/page.tsx            결제 성공 콜백 (confirm 후 주문 상세로 이동)
    fail/page.tsx
  orders/
    page.tsx                    내 주문 목록 (고객)
    [id]/page.tsx               주문 상세
  seller/
    layout.tsx                  role 가드
    page.tsx                    대시보드 (매출/주문/정산 요약)
    products/
      page.tsx                  내 상품 목록
      new/page.tsx              상품 등록
      [id]/edit/page.tsx        상품 수정
    orders/page.tsx             내 상품 주문 현황
    settlements/page.tsx        정산 내역
  api/
    auth/callback/route.ts      Supabase OAuth 콜백 (이메일/패스워드 사용 시에도 보유)
    payments/confirm/route.ts   토스 결제 confirm

components/
  ui/                           shadcn 스타일 수동 컴포넌트
    button.tsx
    input.tsx
    label.tsx
    card.tsx
    badge.tsx
    select.tsx (native select 래퍼)
    textarea.tsx
    separator.tsx
  header.tsx                    상단 헤더 (로고 + 검색 + 장바구니 + 로그인)
  product-card.tsx
  product-grid.tsx
  cart-item-row.tsx
  quantity-input.tsx
  empty-state.tsx
  price.tsx                     가격 포맷 헬퍼 컴포넌트

lib/
  supabase/
    client.ts                   브라우저 클라이언트 (createBrowserClient)
    server.ts                   서버 컴포넌트/액션용 (createServerClient + cookies)
    middleware.ts               미들웨어용 (세션 갱신)
  utils.ts                      cn 헬퍼
  format.ts                     formatKRW, formatDate
  constants.ts                  DEFAULT_COMMISSION_RATE = 0.1 등
  toss.ts                       토스 confirm 헬퍼 (서버)
  auth.ts                       getUser, getProfile, requireRole 헬퍼

middleware.ts                   Supabase 세션 갱신 미들웨어

supabase/
  schema.sql                    DB 스키마 + RLS 정책 (Supabase SQL Editor 붙여넣기용)
  seed.sql                      샘플 카테고리/상품 (선택)

.env.local.example
README.md
SPEC.md
SCHEMA.md
```

## 핵심 흐름

### 회원가입
1. `/signup`에서 이메일/패스워드 + role(`customer`/`seller`) + 이름/전화 입력.
2. `supabase.auth.signUp()` → 성공 시 트리거가 `profiles` row 자동 생성 (role 포함).
3. role=seller인 경우 `/signup` 폼에 사업자 정보(상호/사업자번호/정산 계좌)도 같이 받아 `sellers` row INSERT.
4. 로그인 후 customer는 `/`, seller는 `/seller`로 리디렉션.

### 상품 등록 (판매자)
- `/seller/products/new`: 이름, 설명, 가격, 재고, 카테고리, 대표이미지(URL 입력 - MVP에서는 Supabase Storage 업로드 대신 URL 직접 입력 허용).
- 서버 액션에서 `seller_id = auth.uid()`로 INSERT.

### 장바구니
- `carts` 테이블에 (customer_id, product_id) 유니크. 수량만 변경.
- 비로그인 시 장바구니 버튼은 로그인 페이지로 유도 (MVP).

### 체크아웃 & 결제
1. `/checkout`: 장바구니 → 배송지 입력 → "결제하기"
2. 서버 액션 `createOrder()`: orders row(pending) + order_items rows 생성, toss_order_id 발급.
3. 클라이언트가 토스 결제창 호출(`requestPayment`).
4. 토스 → `/checkout/success?paymentKey=...&orderId=...&amount=...` 리디렉트.
5. success 페이지에서 `/api/payments/confirm` POST → 토스 confirm API → 성공 시 orders.status=paid, 재고 차감, settlements INSERT.
6. `/orders/[id]`로 리디렉트.

### 정산
- 결제 확정 시점에 `order_items`마다 `settlements` row를 `pending` 상태로 INSERT.
- 판매자 대시보드 `/seller/settlements`에서 본인 정산만 조회.
- 실제 송금은 MVP 범위 밖 (수동 처리).

## 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # 서버 측 confirm/정산 등 RLS 우회용
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## UI 톤
- 쿠팡 톤: 흰 배경 + 빨강 포인트 (#ee2e24 계열). 헤더는 흰 배경, 로고는 빨강.
- 가격 강조 표시(굵게, 큰 폰트), 할인율 빨강.
- 한국어 UI.

## MVP 제외
- 검색 자동완성, 추천 시스템, 리뷰/평점, 쿠폰/포인트, 배송 추적, 환불, 정산 송금 자동화, 카테고리 트리(평면 카테고리만), 이미지 업로드(URL 입력만), 다중 이미지 갤러리(대표 1장만).
