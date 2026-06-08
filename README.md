# 마켓 (Shop MVP)

쿠팡 스타일 마켓플레이스 MVP. 판매자/고객이 있고 플랫폼은 거래액 기준 수수료를 가져갑니다.

## 기술 스택

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (수동 shadcn 스타일 컴포넌트)
- Supabase (Auth + Postgres + RLS)
- 토스페이먼츠 (결제)
- lucide-react

## 빠른 시작

### 1. 의존성 설치
이미 `npm install` 완료된 상태입니다.

### 2. Supabase 프로젝트 생성
1. [Supabase 대시보드](https://app.supabase.com/)에서 새 프로젝트 만들기.
2. `Project Settings → API`에서 `URL`, `anon public`, `service_role` 키 복사.
3. `SQL Editor`에서 다음을 순서대로 실행:
   - [`supabase/schema.sql`](supabase/schema.sql) — 기본 스키마, RLS, 트리거.
   - [`supabase/migrations/002_marketplace_features.sql`](supabase/migrations/002_marketplace_features.sql) — 배송/취소/할인가/관리자/이미지 업로드 추가.
   - (선택) [`supabase/seed.sql`](supabase/seed.sql) — 샘플 상품 시드. 안내 주석에 따라 placeholder `seller_id`를 본인 판매자 UUID로 치환 후 실행.
4. `Authentication → Providers → Email`에서 "Confirm email" 옵션을 끄면 회원가입 직후 바로 로그인됩니다(개발 편의).
5. `Authentication → URL Configuration`의 `Site URL`을 `http://localhost:3000`으로 설정. Redirect URL에 `http://localhost:3000/api/auth/callback` 추가.
6. **최초 관리자 만들기**: 일반 가입 후 SQL Editor에서 한 줄 실행 — `update public.profiles set role = 'admin' where id = 'YOUR_USER_ID';`. 이후 `/admin` 접근 가능.

### 3. 토스페이먼츠 키
- 테스트용 공개 키는 `.env.local.example`에 있는 docs용 키를 그대로 써도 됩니다.
- 실제 발급은 [토스페이먼츠 콘솔](https://app.tosspayments.com/)에서.

### 4. 환경변수 작성
```bash
cp .env.local.example .env.local
# .env.local 열어서 Supabase URL/키 입력
```

### 5. 개발 서버
```bash
npm run dev
```
브라우저에서 http://localhost:3000.

## 디렉토리 구조

```
app/
  layout.tsx                루트 레이아웃 (헤더/푸터)
  page.tsx                  홈
  (auth)/login, signup      로그인/회원가입
  products/                 상품 목록(검색/정렬/가격 필터)/상세 (공개)
  cart/                     장바구니
  checkout/                 결제
  orders/                   내 주문 (취소/수령 확인)
  seller/                   판매자 대시보드 (role=seller 한정)
  admin/                    관리자 대시보드 (role=admin 한정)
  api/
    auth/callback           Supabase 이메일 인증 콜백
    cart                    장바구니 REST
  actions/                  서버 액션 (auth/orders/seller-products/admin)

components/
  ui/                       shadcn 스타일 기본 컴포넌트
  header, footer, ...       공통 컴포넌트

lib/
  supabase/                 클라이언트/서버/미들웨어 인스턴스
  toss.ts                   토스 confirm 호출 헬퍼
  auth.ts                   세션/프로필 헬퍼
  format.ts, utils.ts, constants.ts

supabase/
  schema.sql                기본 DB + RLS + 트리거
  migrations/002_...sql     배송/취소/할인가/관리자/Storage
  seed.sql                  샘플 카테고리 + 상품
proxy.ts                    Supabase 세션 갱신 (Next.js 16 proxy)

SPEC.md / SCHEMA.md / UI.md   상세 스펙 문서
```

## 핵심 동작

### 회원가입
- `/signup`에서 `customer` 또는 `seller` 선택.
- `auth.users` INSERT 트리거가 `profiles` row 자동 생성. seller는 `sellers` 추가 row INSERT.
- `admin` 역할은 가입 폼에 없음. 관리자는 SQL로 직접 지정.
- 개발 중엔 Supabase Auth 설정에서 "Confirm email"을 꺼두는 게 편함.

### 배송 & 주문 취소 흐름
1. 결제 완료 → `order_items.delivery_status = 'ready'`.
2. 판매자가 `/seller/orders`에서 "배송 시작" → `shipped` (운송장 번호 옵션).
3. 고객이 `/orders/[id]`에서 "수령 확인" → `delivered`.
4. 고객은 `pending` 또는 `paid` 상태에서 모든 상품이 `ready`인 경우만 취소 가능. `paid` 취소 시 토스 cancel API 자동 호출, 재고 복구, 정산 row 삭제.

### 결제 흐름
1. `/checkout`에서 서버 액션 `createPendingOrder()` 호출 → `orders` row `pending` 상태 생성, `toss_order_id` 발급.
2. 클라이언트가 토스 결제창 (`requestPayment`) 호출.
3. 결제 성공 시 `/checkout/success?paymentKey=...&orderId=...&amount=...` 콜백.
4. 서버에서 토스 confirm API 호출 → `orders.status='paid'`, 재고 차감, `settlements` row 생성.
5. `/orders/[id]`로 리디렉트.

### 수수료
- 기본 10% (`lib/constants.ts → DEFAULT_COMMISSION_RATE`).
- 상품별로 `products.commission_rate` 오버라이드 가능. 판매자 상품 등록 화면에서 입력.
- 주문 시점에 `order_items.commission_rate`로 스냅샷되어 이후 수수료율을 바꿔도 기존 주문엔 영향 없음.

### 정산
- 결제 확정 시 `order_items` 1건마다 `settlements` row 1건이 `pending`으로 생김.
- `/seller/settlements`에서 판매자 본인 정산 내역 조회.
- 관리자는 `/admin/settlements`에서 개별 또는 일괄로 정산 완료 처리 (실제 송금은 외부 처리).

### 관리자 페이지
- `/admin`: 대시보드 (사용자/판매자/상품/주문/매출/수수료/정산 지표 + 최근 주문).
- `/admin/orders`: 전체 주문 (상태 필터).
- `/admin/users`: 사용자 목록.
- `/admin/sellers`: 판매자 + 사업자 정보.
- `/admin/settlements`: 정산 관리 (개별 / 일괄 완료 처리).

### 이미지 업로드
- Supabase Storage `product-images` 버킷 사용 (마이그레이션 002에서 자동 생성).
- 경로 규칙: `{seller_uid}/{uuid}-{filename}`. RLS로 본인 폴더만 쓸 수 있음.
- 클라이언트 5MB / `image/*` 제한. "삭제"는 URL만 비우고 Storage 객체는 남김 (MVP 단순화).

## RLS 메모

- 판매자는 본인 상품, 본인 상품이 포함된 주문, 본인 정산만 볼 수 있음.
- 결제 confirm/재고 차감/정산 INSERT 같이 RLS를 우회해야 하는 작업은 서버에서 `SUPABASE_SERVICE_ROLE_KEY`로 별도 클라이언트(`createServiceClient`)를 만들어 수행.
- 서비스 키는 브라우저에 노출되지 않도록 주의 (`SUPABASE_SERVICE_ROLE_KEY`는 `NEXT_PUBLIC_` 접두사 없음).

## MVP 범위 외

리뷰/평점, 쿠폰/포인트, 자동 배송 추적(운송장 조회 연동), 환불, 자동 정산 송금, 검색 자동완성, 카테고리 트리(평면), Storage 고아 파일 자동 정리.
