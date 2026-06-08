import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";
import { formatKRW, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/types/db";

type OrderListRow = {
  id: string;
  toss_order_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  paid_at: string | null;
  order_items: { product_name: string; quantity: number }[];
};

export default async function OrdersPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      "id, toss_order_id, status, total_amount, created_at, paid_at, order_items(product_name, quantity)",
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OrderListRow[]>();

  const orders = data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">내 주문</h1>
      <p className="mt-1 text-sm text-zinc-500">최근 주문 내역을 확인할 수 있습니다.</p>

      <div className="mt-6">
        {orders.length === 0 ? (
          <EmptyState
            title="주문 내역이 없습니다"
            description="마음에 드는 상품을 찾아보세요."
            action={
              <Link href="/">
                <Button>쇼핑 시작하기</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-medium">주문일시</th>
                  <th className="px-4 py-3 font-medium">상품</th>
                  <th className="px-4 py-3 font-medium text-right">결제금액</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const items = o.order_items ?? [];
                  const first = items[0]?.product_name ?? "주문 상품";
                  const summary = items.length > 1 ? `${first} 외 ${items.length - 1}건` : first;
                  return (
                    <tr key={o.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-3 text-zinc-700">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3 text-zinc-900">{summary}</td>
                      <td className="px-4 py-3 text-right text-zinc-900 font-medium">
                        {formatKRW(o.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/orders/${o.id}`}
                          className="text-sm text-[var(--brand)] hover:underline"
                        >
                          상세보기
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
    </div>
  );
}
