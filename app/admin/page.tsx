import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatKRW, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/types/db";

type RecentOrderRow = {
  id: string;
  toss_order_id: string;
  status: OrderStatus;
  total_amount: number;
  paid_at: string | null;
  created_at: string;
  customer: { name: string | null } | null;
};

type PaidOrderAmount = { total_amount: number };
type OrderItemCommission = {
  commission_amount: number;
  orders: { status: OrderStatus } | null;
};
type SettlementPayout = { payout_amount: number };

export default async function AdminDashboardPage() {
  const service = createServiceClient();

  const [
    profilesCountRes,
    sellersCountRes,
    productsCountRes,
    paidOrdersCountRes,
    paidOrdersSumRes,
    commissionRowsRes,
    pendingSettlementsRes,
    paidSettlementsRes,
    recentOrdersRes,
  ] = await Promise.all([
    service.from("profiles").select("id", { count: "exact", head: true }),
    service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "seller"),
    service
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    service
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid"),
    service
      .from("orders")
      .select("total_amount")
      .eq("status", "paid")
      .returns<PaidOrderAmount[]>(),
    service
      .from("order_items")
      .select("commission_amount, orders!inner(status)")
      .eq("orders.status", "paid")
      .returns<OrderItemCommission[]>(),
    service
      .from("settlements")
      .select("payout_amount")
      .eq("status", "pending")
      .returns<SettlementPayout[]>(),
    service
      .from("settlements")
      .select("payout_amount")
      .eq("status", "paid")
      .returns<SettlementPayout[]>(),
    service
      .from("orders")
      .select(
        `id, toss_order_id, status, total_amount, paid_at, created_at,
         customer:profiles!customer_id(name)`,
      )
      .eq("status", "paid")
      .order("paid_at", { ascending: false, nullsFirst: false })
      .limit(5)
      .returns<RecentOrderRow[]>(),
  ]);

  const usersCount = profilesCountRes.count ?? 0;
  const sellersCount = sellersCountRes.count ?? 0;
  const productsCount = productsCountRes.count ?? 0;
  const paidOrdersCount = paidOrdersCountRes.count ?? 0;

  const grossRevenue = (paidOrdersSumRes.data ?? []).reduce(
    (sum, r) => sum + (r.total_amount ?? 0),
    0,
  );
  const commissionRevenue = (commissionRowsRes.data ?? []).reduce(
    (sum, r) => sum + (r.commission_amount ?? 0),
    0,
  );
  const pendingPayout = (pendingSettlementsRes.data ?? []).reduce(
    (sum, r) => sum + (r.payout_amount ?? 0),
    0,
  );
  const paidPayout = (paidSettlementsRes.data ?? []).reduce(
    (sum, r) => sum + (r.payout_amount ?? 0),
    0,
  );

  const recentOrders = recentOrdersRes.data ?? [];

  const stats: { title: string; value: string; sub?: string }[] = [
    {
      title: "총 사용자",
      value: `${usersCount.toLocaleString("ko-KR")}명`,
      sub: "profiles 전체",
    },
    {
      title: "판매자",
      value: `${sellersCount.toLocaleString("ko-KR")}명`,
      sub: "role = seller",
    },
    {
      title: "판매중 상품",
      value: `${productsCount.toLocaleString("ko-KR")}개`,
      sub: "status = active",
    },
    {
      title: "결제완료 주문",
      value: `${paidOrdersCount.toLocaleString("ko-KR")}건`,
      sub: "status = paid",
    },
    {
      title: "총 매출",
      value: formatKRW(grossRevenue),
      sub: "결제완료 합계",
    },
    {
      title: "총 수수료 매출",
      value: formatKRW(commissionRevenue),
      sub: "플랫폼 수익",
    },
    {
      title: "정산 대기",
      value: formatKRW(pendingPayout),
      sub: "미지급 누계",
    },
    {
      title: "정산 완료",
      value: formatKRW(paidPayout),
      sub: "지급 완료 누계",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">대시보드</h1>
        <p className="mt-1 text-sm text-zinc-500">
          플랫폼 전체 현황과 최근 주문을 확인합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-500">
                {s.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
              {s.sub && <p className="mt-1 text-xs text-zinc-500">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">최근 결제완료 주문</h2>
        {recentOrders.length === 0 ? (
          <EmptyState title="최근 주문이 없습니다" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-medium">결제일</th>
                  <th className="px-4 py-3 font-medium">주문번호</th>
                  <th className="px-4 py-3 font-medium">고객</th>
                  <th className="px-4 py-3 font-medium text-right">결제금액</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">상세</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
                      {o.paid_at ? formatDate(o.paid_at) : formatDate(o.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      {o.toss_order_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-zinc-900">
                      {o.customer?.name ?? "-"}
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
