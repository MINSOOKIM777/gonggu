import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { GroupBuyCard } from "@/components/group-buy-card";
import { Button } from "@/components/ui/button";
import { finalizeExpiredGroupBuys } from "@/lib/group-buy";
import type { GroupBuy, Product } from "@/types/db";

type HomeGroupBuy = GroupBuy & {
  product: Pick<Product, "id" | "name" | "price" | "image_url" | "image_urls" | "status"> | null;
  influencer: { handle: string; profile: { name: string } | null } | null;
};

export default async function Home() {
  await finalizeExpiredGroupBuys();

  const admin = createServiceClient();
  const nowIso = new Date().toISOString();

  const { data: rawGroupBuys } = await admin
    .from("group_buys")
    .select(
      `*, product:products(id, name, price, image_url, image_urls, status),
       influencer:influencers!influencer_id(handle, profile:profiles!id(name))`,
    )
    .eq("status", "open")
    .gt("end_at", nowIso)
    .order("end_at", { ascending: true })
    .limit(12)
    .returns<HomeGroupBuy[]>();

  const groupBuys = (rawGroupBuys ?? []).filter(
    (g): g is HomeGroupBuy & { product: NonNullable<HomeGroupBuy["product"]> } =>
      !!g.product && g.product.status === "active",
  );

  const quantities: Record<string, number> = {};
  await Promise.all(
    groupBuys.map(async (gb) => {
      const { data: qty } = await admin.rpc("group_buy_current_quantity", { gb_id: gb.id });
      quantities[gb.id] = typeof qty === "number" ? qty : 0;
    }),
  );

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-50 to-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center">
          <p className="text-sm font-medium text-[var(--brand)] mb-2">인플루언서 공동구매 플랫폼</p>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-tight">
            믿고 사는 공동구매,<br />
            <span className="text-[var(--brand)]">공구이음</span>에서 함께해요
          </h1>
          <p className="mt-4 text-zinc-500 text-base max-w-md mx-auto">
            내가 팔로우하는 인플루언서가 직접 검증한 상품을 함께 구매하고 더 큰 혜택을 누리세요.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link href="/group-buys">
              <Button size="lg">공동구매 둘러보기</Button>
            </Link>
            <Link href="/signup?role=influencer">
              <Button size="lg" variant="outline">인플루언서 시작하기</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 진행 중인 공동구매 */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">지금 진행 중인 공동구매</h2>
              <p className="text-sm text-zinc-500 mt-1">마감 임박순 · 인플루언서가 직접 진행</p>
            </div>
            <Link href="/group-buys" className="text-sm text-zinc-500 hover:text-[var(--brand)]">
              전체보기 →
            </Link>
          </div>

          {groupBuys.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-lg font-medium">현재 진행 중인 공동구매가 없습니다.</p>
              <p className="text-sm mt-2">곧 새로운 공동구매가 시작될 예정이에요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {groupBuys.map((gb) => (
                <GroupBuyCard
                  key={gb.id}
                  groupBuy={gb}
                  product={gb.product}
                  currentQuantity={quantities[gb.id] ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 인플루언서 입점 CTA */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-xl font-bold text-zinc-900">인플루언서이신가요?</h2>
          <p className="mt-2 text-zinc-500 text-sm">
            직접 상품을 검증하고 팔로워들과 함께 구매하며 수익을 만들어 보세요.
            공급자 상품에 신청하면 바로 공동구매를 시작할 수 있어요.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link href="/signup">
              <Button>인플루언서로 시작하기</Button>
            </Link>
            <Link href="/group-buys">
              <Button variant="outline">공동구매 둘러보기</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
