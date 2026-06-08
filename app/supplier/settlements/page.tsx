import { requireSupplier } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { formatKRW, formatDate } from "@/lib/format";
import { SETTLEMENT_STATUS_LABEL } from "@/lib/constants";

type SettlementRow = {
  id: number;
  order_id: string;
  gross_amount: number;
  commission_amount: number;
  payout_amount: number;
  status: "pending" | "paid";
  created_at: string;
  paid_at: string | null;
  order_item: { product_name: string } | null;
};

export default async function SupplierSettlementsPage() {
  const profile = await requireSupplier();
  const supabase = await createClient();

  const { data } = await supabase
    .from("settlements")
    .select(
      `id, order_id, gross_amount, commission_amount, payout_amount, status, created_at, paid_at,
       order_item:order_items(product_name)`,
    )
    .eq("beneficiary_id", profile.id)
    .eq("beneficiary_type", "supplier")
    .order("created_at", { ascending: false })
    .returns<SettlementRow[]>();

  const rows = data ?? [];
  const pendingSum = rows.filter((r) => r.status === "pending").reduce((s, r) => s + r.payout_amount, 0);
  const paidSum = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.payout_amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">정산</h1>
        <p className="mt-1 text-sm text-zinc-500">판매 정산 내역과 지급 예정 금액입니다.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-zinc-500">정산 대기 합계</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-[var(--price)]">{formatKRW(pendingSum)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-zinc-500">정산 완료 합계</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-zinc-900">{formatKRW(paidSum)}</p></CardContent>
        </Card>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="정산 내역이 없습니다" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">일시</th>
                <th className="px-4 py-3 font-medium">상품</th>
                <th className="px-4 py-3 font-medium text-right">판매금액</th>
                <th className="px-4 py-3 font-medium text-right">수수료</th>
                <th className="px-4 py-3 font-medium text-right">지급예정</th>
                <th className="px-4 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-zinc-900">{r.order_item?.product_name ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{formatKRW(r.gross_amount)}</td>
                  <td className="px-4 py-3 text-right text-red-500">-{formatKRW(r.commission_amount)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatKRW(r.payout_amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === "paid" ? "brand" : "muted"}>
                      {SETTLEMENT_STATUS_LABEL[r.status]}
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
