import Link from "next/link";
import { requireInfluencer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatKRW } from "@/lib/format";
import type { Influencer } from "@/types/db";

export default async function InfluencerDashboardPage() {
  const profile = await requireInfluencer();
  const supabase = await createClient();

  const { data: influencer } = await supabase
    .from("influencers")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle<Influencer>();

  const { count: openGroupBuys } = await supabase
    .from("group_buys")
    .select("id", { count: "exact", head: true })
    .eq("influencer_id", profile.id)
    .eq("status", "open");

  const { count: pendingApplications } = await supabase
    .from("group_buy_applications")
    .select("id", { count: "exact", head: true })
    .eq("influencer_id", profile.id)
    .eq("status", "pending");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: monthItems } = await supabase
    .from("order_items")
    .select("subtotal, orders!inner(status, paid_at)")
    .eq("influencer_id", profile.id)
    .eq("orders.status", "paid")
    .gte("orders.paid_at", monthStart);

  const monthSales = (monthItems ?? []).reduce((s, i) => s + (i.subtotal ?? 0), 0);

  const stats = [
    { title: "진행중 공동구매", value: `${(openGroupBuys ?? 0)}개` },
    { title: "검토중 신청", value: `${(pendingApplications ?? 0)}건` },
    { title: "이번 달 판매액", value: formatKRW(monthSales) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">대시보드</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {profile.name}님
            {influencer ? (
              <> · <span className="text-[var(--brand)]">@{influencer.handle}</span></>
            ) : null}
          </p>
        </div>
        {!influencer && (
          <Link href="/influencer/profile">
            <Button variant="outline" size="sm">채널 정보 등록하기</Button>
          </Link>
        )}
      </div>

      {!influencer && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          채널 정보(인스타그램, 유튜브 등)와 핸들(@이름)을 등록해야 상품 판매 신청이 가능합니다.
          <Link href="/influencer/profile" className="ml-2 font-medium underline">지금 등록 →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader><CardTitle className="text-sm font-medium text-zinc-500">{s.title}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-zinc-900">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/influencer/products" className="rounded-lg border border-zinc-200 bg-white p-5 hover:shadow-sm transition-shadow">
          <p className="font-semibold text-zinc-900">상품 둘러보기</p>
          <p className="text-sm text-zinc-500 mt-1">판매하고 싶은 상품을 찾아 신청하세요.</p>
        </Link>
        <Link href="/influencer/group-buys" className="rounded-lg border border-zinc-200 bg-white p-5 hover:shadow-sm transition-shadow">
          <p className="font-semibold text-zinc-900">공동구매 관리</p>
          <p className="text-sm text-zinc-500 mt-1">진행 중인 공동구매를 확인하세요.</p>
        </Link>
      </div>
    </div>
  );
}
