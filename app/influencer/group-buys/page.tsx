import Link from "next/link";
import { requireInfluencer } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { GROUP_BUY_STATUS_LABEL } from "@/lib/constants";
import { formatKRW, formatDate } from "@/lib/format";
import { finalizeExpiredGroupBuys } from "@/lib/group-buy";
import type { GroupBuy, GroupBuyStatus } from "@/types/db";

type GroupBuyRow = GroupBuy & {
  product: { id: string; name: string; price: number } | null;
};

function statusVariant(s: GroupBuyStatus): "brand" | "muted" | "default" | "outline" {
  if (s === "open") return "brand";
  if (s === "success") return "default";
  return "muted";
}

export const dynamic = "force-dynamic";

export default async function InfluencerGroupBuysPage() {
  const profile = await requireInfluencer();
  await finalizeExpiredGroupBuys();

  const supabase = await createClient();
  const { data } = await supabase
    .from("group_buys")
    .select(`*, product:products(id, name, price)`)
    .eq("influencer_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<GroupBuyRow[]>();

  const list = data ?? [];

  const admin = createServiceClient();
  const quantities: Record<string, number> = {};
  await Promise.all(
    list.map(async (gb) => {
      const { data: qty } = await admin.rpc("group_buy_current_quantity", { gb_id: gb.id });
      quantities[gb.id] = typeof qty === "number" ? qty : 0;
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">공동구매 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">총 {list.length.toLocaleString("ko-KR")}개</p>
        </div>
        <Link href="/influencer/applications">
          <Button variant="outline" size="sm">신청 내역에서 개설 →</Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="공동구매가 없습니다"
          description="상품 판매 신청 후 승인을 받으면 공동구매를 개설할 수 있어요."
          action={<Link href="/influencer/products"><Button>상품 신청하기</Button></Link>}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">상품</th>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium text-right">공구가</th>
                <th className="px-4 py-3 font-medium text-right">목표/현재</th>
                <th className="px-4 py-3 font-medium">마감</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {list.map((gb) => (
                <tr key={gb.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3">{gb.product?.name ?? "-"}</td>
                  <td className="px-4 py-3">{gb.title}</td>
                  <td className="px-4 py-3 text-right">{formatKRW(gb.group_price)}</td>
                  <td className="px-4 py-3 text-right">
                    {gb.target_quantity.toLocaleString("ko-KR")} / {(quantities[gb.id] ?? 0).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(gb.end_at)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(gb.status)}>
                      {GROUP_BUY_STATUS_LABEL[gb.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/group-buys/${gb.id}`}
                        className="text-sm text-zinc-500 hover:underline"
                        target="_blank"
                      >
                        공개 링크
                      </Link>
                      {gb.status === "open" && (
                        <Link
                          href={`/influencer/group-buys/${gb.id}/edit`}
                          className="text-sm text-[var(--brand)] hover:underline"
                        >
                          관리
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
