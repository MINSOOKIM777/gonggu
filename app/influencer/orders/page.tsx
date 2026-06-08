import { requireInfluencer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatKRW, formatDate } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/constants";

type OrderRow = {
  id: string;
  total_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  group_buy: { title: string } | null;
};

export default async function InfluencerOrdersPage() {
  const profile = await requireInfluencer();
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(`id, total_amount, status, paid_at, created_at, group_buy:group_buys(title)`)
    .eq("group_buy.influencer_id", profile.id)
    .not("group_buy_id", "is", null)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">주문</h1>
        <p className="mt-1 text-sm text-zinc-500">내 공동구매를 통한 주문 내역입니다. 총 {rows.length.toLocaleString("ko-KR")}건</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="주문 내역이 없습니다" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">공동구매</th>
                <th className="px-4 py-3 font-medium text-right">결제금액</th>
                <th className="px-4 py-3 font-medium">결제일</th>
                <th className="px-4 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3">{r.group_buy?.title ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatKRW(r.total_amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-500">{r.paid_at ? formatDate(r.paid_at) : "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === "paid" ? "brand" : "muted"}>
                      {ORDER_STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
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
