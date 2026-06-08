import type { GroupBuy, GroupBuyStatus } from "@/types/db";
import { createServiceClient } from "@/lib/supabase/server";

export type GroupBuyWithProgress = GroupBuy & {
  current_quantity: number;
  progress_percent: number;
};

export function effectiveStatus(gb: GroupBuy, currentQuantity: number): GroupBuyStatus {
  if (gb.status !== "open") return gb.status;
  const now = Date.now();
  const endsAt = new Date(gb.end_at).getTime();
  if (endsAt > now) return "open";
  return currentQuantity >= gb.target_quantity ? "success" : "failed";
}

export function isJoinable(gb: GroupBuy, currentQuantity: number): boolean {
  return effectiveStatus(gb, currentQuantity) === "open";
}

export function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function discountPercent(originalPrice: number, groupPrice: number): number {
  if (originalPrice <= 0 || groupPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - groupPrice) / originalPrice) * 100);
}

export function remainingMs(endAt: string): number {
  return new Date(endAt).getTime() - Date.now();
}

export function formatRemaining(endAt: string): string {
  const ms = remainingMs(endAt);
  if (ms <= 0) return "마감";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${mins}분 남음`;
  return `${mins}분 남음`;
}

/**
 * 마감된 group_buys에 대해 success/failed 상태로 lazy transition.
 * Service client 사용 (RLS 우회). 페이지 SSR 진입점에서 호출.
 */
export async function finalizeExpiredGroupBuys(): Promise<void> {
  const admin = createServiceClient();
  const nowIso = new Date().toISOString();

  const { data: expired } = await admin
    .from("group_buys")
    .select("id, target_quantity")
    .eq("status", "open")
    .lt("end_at", nowIso)
    .returns<{ id: string; target_quantity: number }[]>();

  if (!expired || expired.length === 0) return;

  for (const gb of expired) {
    const { data: qty } = await admin.rpc("group_buy_current_quantity", { gb_id: gb.id });
    const current = typeof qty === "number" ? qty : 0;
    const nextStatus: GroupBuyStatus = current >= gb.target_quantity ? "success" : "failed";
    await admin
      .from("group_buys")
      .update({ status: nextStatus, finalized_at: nowIso })
      .eq("id", gb.id);
  }
}

/**
 * 단일 공동구매에 대해 현재 수량과 effective 상태를 반환.
 */
export async function getGroupBuyProgress(id: string): Promise<{
  group_buy: GroupBuy;
  current_quantity: number;
  effective_status: GroupBuyStatus;
  progress_percent: number;
} | null> {
  const admin = createServiceClient();
  const { data: gb } = await admin
    .from("group_buys")
    .select("*")
    .eq("id", id)
    .maybeSingle<GroupBuy>();
  if (!gb) return null;

  const { data: qty } = await admin.rpc("group_buy_current_quantity", { gb_id: id });
  const current_quantity = typeof qty === "number" ? qty : 0;

  return {
    group_buy: gb,
    current_quantity,
    effective_status: effectiveStatus(gb, current_quantity),
    progress_percent: progressPercent(current_quantity, gb.target_quantity),
  };
}
