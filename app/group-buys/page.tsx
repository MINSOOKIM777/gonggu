import { createServiceClient } from "@/lib/supabase/server";
import { GroupBuyCard } from "@/components/group-buy-card";
import { EmptyState } from "@/components/empty-state";
import { finalizeExpiredGroupBuys } from "@/lib/group-buy";
import type { GroupBuy } from "@/types/db";

export const dynamic = "force-dynamic";

type GroupBuyWithProduct = GroupBuy & {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    image_urls: string[];
    status: "active" | "inactive";
  } | null;
};

export default async function GroupBuysPage() {
  await finalizeExpiredGroupBuys();

  const admin = createServiceClient();
  const nowIso = new Date().toISOString();

  const { data: rawGroupBuys } = await admin
    .from("group_buys")
    .select(
      `*, product:products(id, name, price, image_url, image_urls, status)`,
    )
    .eq("status", "open")
    .gt("end_at", nowIso)
    .order("end_at", { ascending: true })
    .returns<GroupBuyWithProduct[]>();

  const groupBuys = (rawGroupBuys ?? []).filter(
    (g): g is GroupBuyWithProduct & { product: NonNullable<GroupBuyWithProduct["product"]> } =>
      !!g.product && g.product.status === "active",
  );

  let quantities: Record<string, number> = {};
  if (groupBuys.length > 0) {
    const entries = await Promise.all(
      groupBuys.map(async (gb) => {
        const { data: qty } = await admin.rpc("group_buy_current_quantity", {
          gb_id: gb.id,
        });
        return [gb.id, typeof qty === "number" ? qty : 0] as const;
      }),
    );
    quantities = Object.fromEntries(entries);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">진행 중인 공동구매</h1>
        <p className="mt-1 text-sm text-zinc-500">
          여러 명이 함께 구매할수록 더 큰 할인 혜택을 받을 수 있어요.
        </p>
      </div>

      {groupBuys.length === 0 ? (
        <EmptyState
          title="진행 중인 공동구매가 없습니다"
          description="새로운 공동구매가 곧 열릴 예정이에요."
        />
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
  );
}
