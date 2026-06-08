import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/product-gallery";
import { GroupBuyProgress } from "@/components/group-buy-progress";
import { GroupBuyCountdown } from "@/components/group-buy-countdown";
import { GroupBuyJoinButton } from "@/components/group-buy-join-button";
import {
  discountPercent,
  finalizeExpiredGroupBuys,
  getGroupBuyProgress,
} from "@/lib/group-buy";
import { GROUP_BUY_STATUS_LABEL } from "@/lib/constants";
import { formatKRW, formatDate } from "@/lib/format";
import type { Product, Influencer, ShippingAddress } from "@/types/db";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

type InfluencerRow = Influencer & {
  profile: { name: string } | null;
};

export default async function GroupBuyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await finalizeExpiredGroupBuys();

  const progress = await getGroupBuyProgress(id);
  if (!progress) notFound();

  const { group_buy: gb, current_quantity, effective_status, progress_percent } = progress;

  const admin = createServiceClient();
  const { data: product } = await admin
    .from("products")
    .select("*")
    .eq("id", gb.product_id)
    .maybeSingle<Product>();
  if (!product) notFound();

  const { data: influencerRow } = await admin
    .from("influencers")
    .select(`*, profile:profiles!id(name)`)
    .eq("id", gb.influencer_id)
    .maybeSingle<InfluencerRow>();

  const influencerName = influencerRow?.profile?.name ?? influencerRow?.handle ?? "인플루언서";
  const influencerHandle = influencerRow?.handle;

  // Build images
  const images: string[] = [];
  if (product.image_url) images.push(product.image_url);
  if (product.image_urls?.length > 0) {
    for (const url of product.image_urls) {
      if (!images.includes(url)) images.push(url);
    }
  }

  const discount = discountPercent(product.price, gb.group_price);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getProfile() : null;

  const { data: savedAddresses } = user
    ? await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .returns<ShippingAddress[]>()
    : { data: [] };

  const joinable = effective_status === "open";

  let disabledLabel = "참여할 수 없습니다";
  if (effective_status === "success") disabledLabel = "공구 성공 — 마감";
  else if (effective_status === "failed") disabledLabel = "공구 실패";
  else if (effective_status === "cancelled") disabledLabel = "취소된 공동구매";

  const statusVariant: "brand" | "muted" | "default" =
    effective_status === "open" ? "brand" : effective_status === "success" ? "default" : "muted";

  const channelLinks = influencerRow ? [
    influencerRow.instagram_url && { label: "Instagram", url: influencerRow.instagram_url, icon: "instagram" },
    influencerRow.youtube_url && { label: "YouTube", url: influencerRow.youtube_url, icon: "youtube" },
    influencerRow.tiktok_url && { label: "TikTok", url: influencerRow.tiktok_url, icon: "tiktok" },
  ].filter(Boolean) as { label: string; url: string; icon: string }[] : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[480px_1fr]">
        <div>
          <ProductGallery images={images} alt={gb.title} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="brand">공동구매</Badge>
            <Badge variant={statusVariant}>{GROUP_BUY_STATUS_LABEL[effective_status]}</Badge>
          </div>

          <h1 className="text-2xl font-bold leading-snug text-zinc-900">{gb.title}</h1>

          {/* 인플루언서 정보 */}
          {influencerRow && (
            <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
              <div className="w-9 h-9 rounded-full bg-[var(--brand)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {influencerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  {influencerName}
                  {influencerHandle && (
                    <Link href={`/g/${influencerHandle}`} className="ml-1.5 text-xs text-zinc-500 hover:text-[var(--brand)]">
                      @{influencerHandle} 채널 →
                    </Link>
                  )}
                </p>
                {channelLinks.length > 0 && (
                  <div className="flex gap-2 mt-0.5">
                    {channelLinks.map((l) => (
                      <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-[var(--brand)]">
                        <ExternalLink className="inline w-3 h-3 mr-0.5" />
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator className="my-1" />

          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400 line-through">정가 {formatKRW(product.price)}</span>
            <div className="flex items-baseline gap-2">
              {discount > 0 && (
                <span className="text-3xl font-bold text-[var(--price)]">{discount}%</span>
              )}
              <span className="text-3xl font-bold text-zinc-900">{formatKRW(gb.group_price)}</span>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
            <GroupBuyProgress current={current_quantity} target={gb.target_quantity} percent={progress_percent} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">남은 시간</span>
              {effective_status === "open" ? (
                <GroupBuyCountdown endAt={gb.end_at} />
              ) : (
                <span className="text-sm font-medium text-zinc-500">마감</span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>마감 {formatDate(gb.end_at)}</span>
              <span>1인 최대 {gb.max_per_user}개</span>
            </div>
          </div>

          <GroupBuyJoinButton
            groupBuyId={gb.id}
            joinable={joinable}
            disabledLabel={disabledLabel}
            maxPerUser={gb.max_per_user}
            isLoggedIn={!!user}
            savedAddresses={savedAddresses ?? []}
          />

          {gb.description && (
            <>
              <Separator className="my-2" />
              <div>
                <h2 className="mb-2 text-sm font-semibold text-zinc-900">공동구매 소개</h2>
                <p className="whitespace-pre-wrap text-sm text-zinc-700">{gb.description}</p>
              </div>
            </>
          )}

          {product.description && (
            <>
              <Separator className="my-2" />
              <div>
                <h2 className="mb-2 text-sm font-semibold text-zinc-900">상품 상세</h2>
                <p className="whitespace-pre-wrap text-sm text-zinc-700">{product.description}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
