import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatKRW, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/db";

type OrderRow = {
  id: string;
  toss_order_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  paid_at: string | null;
  customer: { name: string | null } | null;
  items: { product_name: string }[] | null;
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "결제대기" },
  { value: "paid", label: "결제완료" },
  { value: "cancelled", label: "취소" },
  { value: "failed", label: "결제실패" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status ?? "all";

  const service = createServiceClient();
  let query = service
    .from("orders")
    .select(
      `id, toss_order_id, status, total_amount, created_at, paid_at,
       customer:profiles!customer_id(name),
       items:order_items(product_name)`,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query.returns<OrderRow[]>();
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">주문</h1>
          <p className="mt-1 text-sm text-zinc-500">
            전체 주문 목록입니다. 총 {rows.length.toLocaleString("ko-KR")}건
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-md border border-zinc-200 bg-white p-1">
          {STATUS_FILTERS.map((f) => {
            const active = f.value === statusFilter;
            const href = f.value === "all" ? "/admin/orders" : `/admin/orders?status=${f.value}`;
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
      </div>

      {rows.length === 0 ? (
        <EmptyState title="주문 내역이 없습니다" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">주문일</th>
                <th className="px-4 py-3 font-medium">주문번호</th>
                <th className="px-4 py-3 font-medium">고객</th>
                <th className="px-4 py-3 font-medium">상품</th>
                <th className="px-4 py-3 font-medium text-right">결제금액</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">상세</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const items = o.items ?? [];
                const first = items[0]?.product_name ?? "-";
                const summary =
                  items.length > 1 ? `${first} 외 ${items.length - 1}건` : first;
                return (
                  <tr key={o.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      {o.toss_order_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-zinc-900">
                      {o.customer?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-zinc-900">{summary}</td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900">
                      {formatKRW(o.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-sm text-zinc-700 underline-offset-2 hover:underline"
                      >
                        상세
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
