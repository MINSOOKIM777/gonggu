import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { GroupBuyCard } from "@/components/group-buy-card";
import { finalizeExpiredGroupBuys, getGroupBuyProgress } from "@/lib/group-buy";
import { formatKRW } from "@/lib/format";
import type { GroupBuy, Influencer, Product } from "@/types/db";
import { ExternalLink } from "lucide-react";

type InfluencerProfile = Influencer & {
  profile: { name: string } | null;
};

type GroupBuyRow = GroupBuy & {
  product: Pick<Product, "id" | "name" | "price" | "image_url" | "image_urls" | "status"> | null;
};

export const dynamic = "force-dynamic";

export default async function InfluencerPublicPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  await finalizeExpiredGroupBuys();

  const admin = createServiceClient();

  const { data: inf } = await admin
    .from("influencers")
    .select(`*, profile:profiles!id(name)`)
    .eq("handle", handle)
    .maybeSingle<InfluencerProfile>();

  if (!inf) notFound();

  const nowIso = new Date().toISOString();
  const { data: rawGroupBuys } = await admin
    .from("group_buys")
    .select(`*, product:products(id, name, price, image_url, image_urls, status)`)
    .eq("influencer_id", inf.id)
    .eq("status", "open")
    .gt("end_at", nowIso)
    .order("end_at", { ascending: true })
    .returns<GroupBuyRow[]>();

  const groupBuys = (rawGroupBuys ?? []).filter(
    (g): g is GroupBuyRow & { product: NonNullable<GroupBuyRow["product"]> } =>
      !!g.product && g.product.status === "active",
  );

  const quantities: Record<string, number> = {};
  await Promise.all(
    groupBuys.map(async (gb) => {
      const { data: qty } = await admin.rpc("group_buy_current_quantity", { gb_id: gb.id });
      quantities[gb.id] = typeof qty === "number" ? qty : 0;
    }),
  );

  const channelLinks = [
    inf.instagram_url && { label: "Instagram", url: inf.instagram_url, icon: "instagram" },
    inf.youtube_url && { label: "YouTube", url: inf.youtube_url, icon: "youtube" },
    inf.tiktok_url && { label: "TikTok", url: inf.tiktok_url, icon: "tiktok" },
    inf.blog_url && { label: "블로그", url: inf.blog_url, icon: "blog" },
    inf.other_url && { label: "채널", url: inf.other_url, icon: "other" },
  ].filter(Boolean) as { label: string; url: string; icon: string }[];

  return (
    <div className="min-h-screen bg-white">
      {/* 인플루언서 프로필 헤더 */}
      <div className="bg-gradient-to-b from-zinc-50 to-white border-b border-zinc-200">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-[var(--brand)] flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {(inf.profile?.name ?? inf.handle).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-zinc-900">{inf.profile?.name ?? inf.handle}</h1>
              <p className="text-sm text-zinc-500 mt-0.5">@{inf.handle}</p>
              {inf.bio && (
                <p className="mt-2 text-sm text-zinc-600 max-w-md">{inf.bio}</p>
              )}
              {channelLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {channelLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 진행중 공동구매 */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">
          진행 중인 공동구매
          {groupBuys.length > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-500">({groupBuys.length}개)</span>
          )}
        </h2>

        {groupBuys.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <p className="text-lg">현재 진행 중인 공동구매가 없습니다.</p>
            <p className="text-sm mt-1">새 공동구매가 시작되면 이 페이지에서 확인하세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupBuys.map((gb) => (
              <GroupBuyCard
                key={gb.id}
                groupBuy={gb}
                product={gb.product}
                currentQuantity={quantities[gb.id] ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
