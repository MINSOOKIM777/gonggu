-- Shop MVP seed data
-- ============================================================
-- 사용 방법
-- ------------------------------------------------------------
-- 1) supabase/schema.sql 및 supabase/migrations/002_marketplace_features.sql
--    을 먼저 실행해 두세요.
-- 2) 실제 판매자 계정으로 회원가입(role='seller')을 한 번 진행한 뒤,
--    Supabase Auth 대시보드 또는 SQL Editor에서 해당 user.id (uuid) 를 확인합니다.
-- 3) 아래 placeholder uuid `00000000-0000-0000-0000-000000000000`를
--    실제 seller id로 전부 치환(Find & Replace)한 뒤 Supabase SQL Editor에
--    붙여 실행하세요.
-- 4) 최초 관리자 권한 부여:
--      update public.profiles set role = 'admin' where id = '<YOUR_USER_ID>';
-- ============================================================

-- ============ 카테고리 추가(이미 있다면 무시) ============
insert into public.categories (name, slug) values
  ('식품', 'food'),
  ('생활용품', 'household'),
  ('패션', 'fashion'),
  ('전자제품', 'electronics'),
  ('도서', 'books'),
  ('뷰티', 'beauty'),
  ('가구', 'furniture'),
  ('스포츠', 'sports'),
  ('완구', 'toys'),
  ('반려동물', 'pets'),
  ('주방용품', 'kitchen'),
  ('신선식품', 'fresh-food')
on conflict (slug) do nothing;

-- ============ 샘플 상품 ============
-- placeholder seller_id를 실제 seller uuid로 치환 후 실행하세요.
insert into public.products (
  seller_id, category_id, name, description,
  price, compare_at_price, stock, image_url, commission_rate, status
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  (select id from public.categories where slug = v.slug),
  v.name, v.description,
  v.price, v.compare_at_price, v.stock, v.image_url, v.commission_rate, 'active'
from (values
  ('electronics', '무선 블루투스 이어폰 Pro',
   '저지연 게이밍 모드 지원, 30시간 재생, IPX5 방수.',
   59000, 89000, 120, 'https://picsum.photos/seed/earbuds/640/640', 0.10),
  ('electronics', '4K UHD 모니터 27인치',
   'IPS 패널, HDR400, 144Hz 주사율. 게이밍/작업 모두 적합.',
   329000, 459000, 35, 'https://picsum.photos/seed/monitor/640/640', 0.10),
  ('electronics', '기계식 키보드 텐키리스',
   '핫스왑 가능, RGB 백라이트, 갈축. 타건감 최상.',
   89000, null, 80, 'https://picsum.photos/seed/keyboard/640/640', 0.10),
  ('electronics', '고속 충전기 65W GaN',
   'USB-C 3포트 + USB-A 1포트. 노트북도 충전 가능.',
   34000, 49000, 200, 'https://picsum.photos/seed/charger/640/640', 0.10),
  ('fashion', '오버핏 라운드 반팔 티셔츠',
   '코튼 100%, 봄/여름용. 5가지 컬러.',
   15900, 25900, 300, 'https://picsum.photos/seed/tshirt/640/640', 0.12),
  ('fashion', '슬림 데님 진',
   '신축성 있는 스트레치 데님. 워싱 가공.',
   39000, 59000, 150, 'https://picsum.photos/seed/jeans/640/640', 0.12),
  ('beauty', '히알루론산 수분 토너 200ml',
   '저자극 기초화장품. 알코올 무첨가.',
   18000, null, 250, 'https://picsum.photos/seed/toner/640/640', 0.15),
  ('beauty', '비타민 세럼 30ml',
   '브라이트닝 케어. 매일 아침 사용 권장.',
   22000, 35000, 180, 'https://picsum.photos/seed/serum/640/640', 0.15),
  ('food', '국내산 햇감자 5kg',
   '강원도 산지직송. 신선한 햇감자.',
   12900, 16900, 100, 'https://picsum.photos/seed/potato/640/640', 0.08),
  ('food', '프리미엄 한우 등심 500g',
   '1++ 등급. 진공포장, 냉장배송.',
   89000, 119000, 25, 'https://picsum.photos/seed/beef/640/640', 0.08),
  ('fresh-food', '제주 감귤 3kg',
   '당도 12 brix 이상. 알이 작고 달콤.',
   19900, 24900, 60, 'https://picsum.photos/seed/orange/640/640', 0.08),
  ('household', '극세사 청소 걸레 10매',
   '주방, 욕실, 거실 어디서나 사용 가능.',
   8900, null, 500, 'https://picsum.photos/seed/cloth/640/640', 0.10),
  ('kitchen', '인덕션 호환 통주물 후라이팬 28cm',
   '눌어붙음 방지 코팅, 가스/인덕션 겸용.',
   45000, 69000, 70, 'https://picsum.photos/seed/pan/640/640', 0.10),
  ('books', '실전 자바스크립트 (개정판)',
   '모던 JS 입문서. 400페이지.',
   28000, null, 90, 'https://picsum.photos/seed/book/640/640', 0.10),
  ('sports', '요가매트 6mm',
   '미끄럼 방지, 친환경 TPE 소재.',
   24000, 32000, 130, 'https://picsum.photos/seed/yoga/640/640', 0.10),
  ('pets', '반려견 사료 연어&닭 5kg',
   '전 연령용, 그레인프리.',
   42000, 55000, 45, 'https://picsum.photos/seed/dogfood/640/640', 0.10),
  ('toys', '원목 블록 100피스',
   '안전 페인트, 36개월 이상 권장.',
   29000, null, 60, 'https://picsum.photos/seed/blocks/640/640', 0.10),
  ('furniture', '1인용 패브릭 소파',
   '조립식, 천갈이 가능. 다크그레이.',
   159000, 219000, 20, 'https://picsum.photos/seed/sofa/640/640', 0.10)
) as v(slug, name, description, price, compare_at_price, stock, image_url, commission_rate);
