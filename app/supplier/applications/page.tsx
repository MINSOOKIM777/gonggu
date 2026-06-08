import { requireSupplier } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ApplicationActionButtons } from "@/components/supplier/application-action-buttons";
import { formatDate } from "@/lib/format";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants";
import type { ApplicationStatus } from "@/types/db";

type ApplicationRow = {
  id: number;
  status: ApplicationStatus;
  message: string | null;
  rejected_reason: string | null;
  created_at: string;
  product: { id: string; name: string; price: number } | null;
  influencer: {
    id: string;
    handle: string;
    bio: string | null;
    instagram_url: string | null;
    youtube_url: string | null;
    tiktok_url: string | null;
  } | null;
  influencer_profile: { name: string } | null;
};

function statusVariant(s: ApplicationStatus): "brand" | "muted" | "default" {
  if (s === "approved") return "brand";
  if (s === "rejected") return "muted";
  return "default";
}

export default async function SupplierApplicationsPage() {
  await requireSupplier();
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id");
  const productIds = (products ?? []).map((p) => p.id);

  const { data } = productIds.length === 0
    ? { data: [] }
    : await supabase
        .from("group_buy_applications")
        .select(
          `id, status, message, rejected_reason, created_at,
           product:products(id, name, price),
           influencer:influencers!influencer_id(id, handle, bio, instagram_url, youtube_url, tiktok_url),
           influencer_profile:profiles!influencer_id(name)`,
        )
        .in("product_id", productIds)
        .order("created_at", { ascending: false })
        .returns<ApplicationRow[]>();

  const list = (data ?? []) as ApplicationRow[];
  const pending = list.filter((a) => a.status === "pending");
  const reviewed = list.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">판매 신청 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">
          인플루언서들의 공동구매 판매 신청을 검토하세요.
        </p>
      </div>

      {list.length === 0 ? (
        <EmptyState title="신청 내역이 없습니다" description="인플루언서가 상품 판매를 신청하면 여기에 표시됩니다." />
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-900">
                검토 대기 <span className="text-[var(--brand)]">({pending.length})</span>
              </h2>
              <div className="space-y-3">
                {pending.map((app) => (
                  <ApplicationCard key={app.id} app={app} showActions />
                ))}
              </div>
            </section>
          )}

          {reviewed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-zinc-500">처리 완료</h2>
              <div className="space-y-3">
                {reviewed.map((app) => (
                  <ApplicationCard key={app.id} app={app} showActions={false} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ChannelLinks({ app }: { app: ApplicationRow }) {
  const inf = app.influencer;
  if (!inf) return null;
  const links = [
    inf.instagram_url && { label: "Instagram", url: inf.instagram_url },
    inf.youtube_url && { label: "YouTube", url: inf.youtube_url },
    inf.tiktok_url && { label: "TikTok", url: inf.tiktok_url },
  ].filter(Boolean) as { label: string; url: string }[];
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--brand)] hover:underline"
        >
          {l.label} ↗
        </a>
      ))}
    </div>
  );
}

function ApplicationCard({
  app,
  showActions,
}: {
  app: ApplicationRow;
  showActions: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-zinc-900">
              {app.influencer_profile?.name ?? "인플루언서"}{" "}
              <span className="text-zinc-500 font-normal">
                @{app.influencer?.handle}
              </span>
            </span>
            <Badge variant={statusVariant(app.status)}>
              {APPLICATION_STATUS_LABEL[app.status]}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            상품: {app.product?.name ?? "-"}
          </p>
          <ChannelLinks app={app} />
          {app.influencer?.bio && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{app.influencer.bio}</p>
          )}
        </div>
        <p className="text-xs text-zinc-400 whitespace-nowrap">{formatDate(app.created_at)}</p>
      </div>

      {app.message && (
        <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
          <p className="text-xs font-medium text-zinc-500 mb-1">신청 메시지</p>
          <p>{app.message}</p>
        </div>
      )}

      {app.rejected_reason && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          <p className="text-xs font-medium mb-1">거절 사유</p>
          <p>{app.rejected_reason}</p>
        </div>
      )}

      {showActions && <ApplicationActionButtons applicationId={app.id} />}
    </div>
  );
}
