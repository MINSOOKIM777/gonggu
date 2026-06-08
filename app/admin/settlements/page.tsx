import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { SettlementActionButton } from "@/components/admin/settlement-action-button";
import { BulkSettleButton } from "@/components/admin/bulk-settle-button";
import { formatKRW, formatDate } from "@/lib/format";
import { SETTLEMENT_STATUS_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SettlementRow = {
  id: number;
  order_id: string;
  gross_amount: number;
  commission_amount: number;
  payout_amount: number;
  status: "pending" | "paid";
  created_at: string;
  paid_at: string | null;
  seller: { name: string | null } | null;
  order_item: { product_name: string } | null;
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "정산대기" },
  { value: "paid", label: "정산완료" },
];

export default async function AdminSettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status ?? "pending";

  const service = createServiceClient();
  let query = service
    .from("settlements")
    .select(
      `id, order_id, gross_amount, commission_amount, payout_amount, status, created_at, paid_at,
       seller:profiles!seller_id(name),
       order_item:order_items(product_name)`,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query.returns<SettlementRow[]>();
  const rows = data ?? [];

  const pendingRows = rows.filter((r) => r.status === "pending");
  const paidRows = rows.filter((r) => r.status === "paid");
  const pendingSum = pendingRows.reduce((s, r) => s + r.payout_amount, 0);
  const paidSum = paidRows.reduce((s, r) => s + r.payout_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">정산</h1>
          <p className="mt-1 text-sm text-zinc-500">
            판매자 정산 내역과 일괄 처리를 관리합니다.
          </p>
        </div>
        <BulkSettleButton pendingCount={pendingRows.length} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-500">
              정산 대기 합계 (현재 필터)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900">{formatKRW(pendingSum)}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {pendingRows.length.toLocaleString("ko-KR")}건
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-500">
              정산 완료 합계 (현재 필터)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900">{formatKRW(paidSum)}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {paidRows.length.toLocaleString("ko-KR")}건
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-1 rounded-md border border-zinc-200 bg-white p-1 w-fit">
        {STATUS_FILTERS.map((f) => {
          const active = f.value === statusFilter;
          const href =
            f.value === "all"
              ? "/admin/settlements?status=all"
              : `/admin/settlements?status=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="정산 내역이 없습니다" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">일시</th>
                <th className="px-4 py-3 font-medium">판매자</th>
                <th className="px-4 py-3 font-medium">주문/상품</th>
                <th className="px-4 py-3 font-medium text-right">판매금액</th>
                <th className="px-4 py-3 font-medium text-right">수수료</th>
                <th className="px-4 py-3 font-medium text-right">지급예정</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">처리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0 align-top">
                  <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-zinc-900">
                    {r.seller?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-zinc-900">
                      {r.order_item?.product_name ?? "-"}
                    </div>
                    <div className="font-mono text-xs text-zinc-500">
                      {r.order_id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-900">
                    {formatKRW(r.gross_amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500">
                    {formatKRW(r.commission_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900">
                    {formatKRW(r.payout_amount)}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "paid" ? (
                      <Badge variant="brand">{SETTLEMENT_STATUS_LABEL.paid}</Badge>
                    ) : (
                      <Badge variant="muted">{SETTLEMENT_STATUS_LABEL.pending}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" ? (
                      <SettlementActionButton settlementId={r.id} />
                    ) : (
                      <span className="text-xs text-zinc-400">
                        {r.paid_at ? formatDate(r.paid_at) : "-"}
                      </span>
                    )}
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
