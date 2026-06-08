import Link from "next/link";
import { notFound } from "next/navigation";
import { requireInfluencer } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { GroupBuyForm } from "@/components/seller/group-buy-form";
import { GroupBuyCloseButton } from "@/components/seller/group-buy-close-button";
import { updateGroupBuy } from "@/app/actions/group-buy";
import { GROUP_BUY_STATUS_LABEL } from "@/lib/constants";
import { formatKRW } from "@/lib/format";
import type { GroupBuy, GroupBuyStatus } from "@/types/db";

function statusVariant(s: GroupBuyStatus): "brand" | "muted" | "default" {
  if (s === "open") return "brand";
  if (s === "success") return "default";
  return "muted";
}

export default async function EditInfluencerGroupBuyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireInfluencer();
  const supabase = await createClient();

  const { data: gb } = await supabase
    .from("group_buys")
    .select("*")
    .eq("id", id)
    .eq("influencer_id", profile.id)
    .maybeSingle<GroupBuy>();

  if (!gb) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, price")
    .eq("id", gb.product_id)
    .maybeSingle<{ id: string; name: string; price: number }>();

  const admin = createServiceClient();
  const { data: qty } = await admin.rpc("group_buy_current_quantity", { gb_id: id });
  const current = typeof qty === "number" ? qty : 0;

  const updateAction = updateGroupBuy.bind(null, id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/influencer/group-buys" className="text-sm text-zinc-500 hover:underline">← 공동구매 목록으로</Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">공동구매 관리</h1>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 flex items-center gap-4">
        <div className="flex-1">
          <p className="font-medium text-zinc-900">{gb.title}</p>
          <p className="text-sm text-zinc-500">현재 참여: {current.toLocaleString("ko-KR")} / 목표 {gb.target_quantity.toLocaleString("ko-KR")}개</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-zinc-900">{formatKRW(gb.group_price)}</span>
          <Badge variant={statusVariant(gb.status)}>{GROUP_BUY_STATUS_LABEL[gb.status]}</Badge>
        </div>
      </div>

      {gb.status === "open" && (
        <>
          <GroupBuyForm
            action={updateAction}
            products={product ? [product] : []}
            initial={gb}
            submitLabel="저장"
          />
          <div className="border-t border-zinc-200 pt-6">
            <h2 className="text-sm font-semibold text-zinc-700">공동구매 조기 마감</h2>
            <p className="mt-1 text-xs text-zinc-500">현재 수량으로 성공/실패를 확정합니다.</p>
            <div className="mt-3">
              <GroupBuyCloseButton id={id} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
