import Link from "next/link";
import { requireInfluencer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatKRW } from "@/lib/format";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants";
import type { ApplicationStatus } from "@/types/db";

type ApplicationRow = {
  id: number;
  status: ApplicationStatus;
  message: string | null;
  rejected_reason: string | null;
  created_at: string;
  product: { id: string; name: string; price: number; image_url: string | null } | null;
};

function statusVariant(s: ApplicationStatus): "brand" | "muted" | "default" {
  if (s === "approved") return "brand";
  if (s === "rejected") return "muted";
  return "default";
}

export default async function InfluencerApplicationsPage() {
  const profile = await requireInfluencer();
  const supabase = await createClient();

  const { data } = await supabase
    .from("group_buy_applications")
    .select(
      `id, status, message, rejected_reason, created_at,
       product:products(id, name, price, image_url)`,
    )
    .eq("influencer_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<ApplicationRow[]>();

  const list = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">판매 신청 내역</h1>
        <p className="mt-1 text-sm text-zinc-500">공급자 승인 후 공동구매를 개설할 수 있어요.</p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="신청 내역이 없습니다"
          description="상품 둘러보기에서 판매하고 싶은 상품을 신청해 보세요."
          action={<Link href="/influencer/products"><Button variant="outline">상품 둘러보기</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {list.map((app) => (
            <div key={app.id} className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {app.product?.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={app.product.image_url}
                      alt={app.product.name}
                      className="h-14 w-14 rounded-md object-cover border border-zinc-200 shrink-0"
                    />
                  )}
                  <div>
                    <p className="font-medium text-zinc-900">{app.product?.name ?? "-"}</p>
                    <p className="text-sm text-zinc-500">{formatKRW(app.product?.price ?? 0)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={statusVariant(app.status)}>
                    {APPLICATION_STATUS_LABEL[app.status]}
                  </Badge>
                  <span className="text-xs text-zinc-400">{formatDate(app.created_at)}</span>
                </div>
              </div>
              {app.message && (
                <p className="text-sm text-zinc-600 bg-zinc-50 rounded p-2">{app.message}</p>
              )}
              {app.rejected_reason && (
                <p className="text-sm text-red-600 bg-red-50 rounded p-2">
                  거절 사유: {app.rejected_reason}
                </p>
              )}
              {app.status === "approved" && app.product && (
                <div>
                  <Link href={`/influencer/group-buys/new?product_id=${app.product.id}&application_id=${app.id}`}>
                    <Button size="sm" variant="outline">공동구매 개설하기 →</Button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
