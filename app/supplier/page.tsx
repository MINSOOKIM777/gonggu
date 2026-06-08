import { requireSupplier } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKRW } from "@/lib/format";

export default async function SupplierDashboardPage() {
  const profile = await requireSupplier();
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count: activeProducts } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", profile.id)
    .eq("status", "active");

  const { count: pendingApplications } = await supabase
    .from("group_buy_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .in(
      "product_id",
      (
        await supabase
          .from("products")
          .select("id")
          .eq("supplier_id", profile.id)
      ).data?.map((p) => p.id) ?? [],
    );

  const { data: monthItems } = await supabase
    .from("order_items")
    .select("subtotal, commission_amount, orders!inner(status, paid_at)")
    .eq("supplier_id", profile.id)
    .eq("orders.status", "paid")
    .gte("orders.paid_at", monthStart);

  const monthGross = (monthItems ?? []).reduce((s, i) => s + (i.subtotal ?? 0), 0);
  const monthCommission = (monthItems ?? []).reduce((s, i) => s + (i.commission_amount ?? 0), 0);

  const { data: pendingSettlements } = await supabase
    .from("settlements")
    .select("payout_amount")
    .eq("beneficiary_id", profile.id)
    .eq("status", "pending");
  const pendingPayout = (pendingSettlements ?? []).reduce((s, r) => s + r.payout_amount, 0);

  const stats = [
    { title: "판매중 상품", value: `${(activeProducts ?? 0).toLocaleString("ko-KR")}개` },
    { title: "검토 대기 신청", value: `${(pendingApplications ?? 0).toLocaleString("ko-KR")}건`, highlight: (pendingApplications ?? 0) > 0 },
    { title: "이번 달 매출", value: formatKRW(monthGross) },
    { title: "이번 달 수수료", value: formatKRW(monthCommission) },
    { title: "정산 대기", value: formatKRW(pendingPayout) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">대시보드</h1>
        <p className="mt-1 text-sm text-zinc-500">{profile.name}님, 환영합니다.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-500">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${s.highlight ? "text-[var(--brand)]" : "text-zinc-900"}`}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
