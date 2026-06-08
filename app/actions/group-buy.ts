"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import type { GroupBuy, GroupBuyStatus } from "@/types/db";

export type GroupBuyActionResult = { ok: true } | { ok: false; error: string };

export type JoinGroupBuyResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

type ParsedGroupBuy = {
  product_id: string;
  application_id: number | null;
  title: string;
  description: string | null;
  group_price: number;
  target_quantity: number;
  max_per_user: number;
  start_at: string;
  end_at: string;
};

function parseDatetimeLocal(raw: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseGroupBuyForm(
  formData: FormData,
): { error: string } | { values: ParsedGroupBuy } {
  const productId = String(formData.get("product_id") ?? "").trim();
  const applicationIdRaw = String(formData.get("application_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const groupPriceRaw = String(formData.get("group_price") ?? "").trim();
  const targetRaw = String(formData.get("target_quantity") ?? "").trim();
  const maxPerUserRaw = String(formData.get("max_per_user") ?? "").trim();
  const startAtRaw = String(formData.get("start_at") ?? "").trim();
  const endAtRaw = String(formData.get("end_at") ?? "").trim();

  if (!productId) return { error: "상품을 선택해 주세요." };
  if (!title) return { error: "제목을 입력해 주세요." };

  const groupPrice = Number(groupPriceRaw);
  if (!Number.isFinite(groupPrice) || groupPrice < 0) {
    return { error: "공구 판매가를 올바르게 입력해 주세요." };
  }

  const target = Number(targetRaw);
  if (!Number.isFinite(target) || target <= 0 || !Number.isInteger(target)) {
    return { error: "목표 수량을 올바르게 입력해 주세요." };
  }

  const maxPerUser = maxPerUserRaw === "" ? 10 : Number(maxPerUserRaw);
  if (!Number.isFinite(maxPerUser) || maxPerUser <= 0 || !Number.isInteger(maxPerUser)) {
    return { error: "1인 최대 구매 수량을 올바르게 입력해 주세요." };
  }

  const startAtIso = startAtRaw
    ? parseDatetimeLocal(startAtRaw)
    : new Date().toISOString();
  if (!startAtIso) return { error: "시작일시가 올바르지 않습니다." };

  const endAtIso = parseDatetimeLocal(endAtRaw);
  if (!endAtIso) return { error: "마감일시를 입력해 주세요." };

  if (new Date(endAtIso).getTime() <= new Date(startAtIso).getTime()) {
    return { error: "마감일시는 시작일시 이후여야 합니다." };
  }

  const application_id =
    applicationIdRaw !== "" && !Number.isNaN(Number(applicationIdRaw))
      ? Number(applicationIdRaw)
      : null;

  return {
    values: {
      product_id: productId,
      application_id,
      title,
      description: description || null,
      group_price: Math.round(groupPrice),
      target_quantity: target,
      max_per_user: maxPerUser,
      start_at: startAtIso,
      end_at: endAtIso,
    },
  };
}

export async function createGroupBuy(
  formData: FormData,
): Promise<GroupBuyActionResult> {
  const parsed = parseGroupBuyForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  // application이 있으면 승인 여부 확인
  if (parsed.values.application_id) {
    const { data: app } = await supabase
      .from("group_buy_applications")
      .select("id, status")
      .eq("id", parsed.values.application_id)
      .eq("influencer_id", user.id)
      .maybeSingle<{ id: number; status: string }>();

    if (!app || app.status !== "approved") {
      return { ok: false, error: "승인된 신청 건에 대해서만 공동구매를 만들 수 있습니다." };
    }
  }

  const { error } = await supabase.from("group_buys").insert({
    influencer_id: user.id,
    ...parsed.values,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/influencer/group-buys");
  revalidatePath("/group-buys");
  redirect("/influencer/group-buys");
}

export async function updateGroupBuy(
  id: string,
  formData: FormData,
): Promise<GroupBuyActionResult> {
  const parsed = parseGroupBuyForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("group_buys")
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("influencer_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/influencer/group-buys");
  revalidatePath(`/influencer/group-buys/${id}/edit`);
  revalidatePath(`/group-buys/${id}`);
  revalidatePath("/group-buys");
  redirect("/influencer/group-buys");
}

export async function closeGroupBuy(id: string): Promise<GroupBuyActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { data: gb } = await supabase
    .from("group_buys")
    .select("id, influencer_id, status, target_quantity")
    .eq("id", id)
    .maybeSingle<{ id: string; influencer_id: string; status: GroupBuyStatus; target_quantity: number }>();

  if (!gb) return { ok: false, error: "공동구매를 찾을 수 없습니다." };
  if (gb.influencer_id !== user.id) {
    return { ok: false, error: "본인 공동구매만 처리할 수 있습니다." };
  }
  if (gb.status !== "open") {
    return { ok: false, error: "진행 중인 공동구매만 마감할 수 있습니다." };
  }

  const admin = createServiceClient();
  const { data: qty } = await admin.rpc("group_buy_current_quantity", { gb_id: id });
  const current = typeof qty === "number" ? qty : 0;
  const nowIso = new Date().toISOString();

  const nextStatus: GroupBuyStatus =
    current === 0 ? "cancelled" : current >= gb.target_quantity ? "success" : "failed";

  const { error } = await supabase
    .from("group_buys")
    .update({ status: nextStatus, finalized_at: nowIso })
    .eq("id", id)
    .eq("influencer_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/influencer/group-buys");
  revalidatePath(`/influencer/group-buys/${id}/edit`);
  revalidatePath(`/group-buys/${id}`);
  revalidatePath("/group-buys");
  return { ok: true };
}

export async function joinGroupBuy(
  formData: FormData,
): Promise<JoinGroupBuyResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const groupBuyId = String(formData.get("group_buy_id") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const recipientName = String(formData.get("recipient_name") ?? "").trim();
  const recipientPhone = String(formData.get("recipient_phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const addressDetail = String(formData.get("address_detail") ?? "").trim();

  if (!groupBuyId) return { ok: false, error: "공동구매 정보가 올바르지 않습니다." };
  const quantity = Number(quantityRaw);
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    return { ok: false, error: "수량을 올바르게 입력해 주세요." };
  }
  if (!recipientName || !recipientPhone || !address) {
    return { ok: false, error: "받는 사람 정보와 주소를 입력해 주세요." };
  }

  const admin = createServiceClient();
  const { data: gb } = await admin
    .from("group_buys")
    .select("*")
    .eq("id", groupBuyId)
    .maybeSingle<GroupBuy>();
  if (!gb) return { ok: false, error: "공동구매를 찾을 수 없습니다." };
  if (gb.status !== "open") return { ok: false, error: "참여할 수 없는 공동구매입니다." };
  if (new Date(gb.end_at).getTime() <= Date.now()) return { ok: false, error: "마감된 공동구매입니다." };
  if (quantity > gb.max_per_user) {
    return { ok: false, error: `1인 최대 ${gb.max_per_user}개까지 구매 가능합니다.` };
  }

  const { data: product } = await admin
    .from("products")
    .select("id, supplier_id, name, price, stock, commission_rate, status")
    .eq("id", gb.product_id)
    .maybeSingle<{
      id: string;
      supplier_id: string;
      name: string;
      price: number;
      stock: number;
      commission_rate: number | string;
      status: "active" | "inactive";
    }>();
  if (!product) return { ok: false, error: "상품을 찾을 수 없습니다." };
  if (product.status !== "active") return { ok: false, error: "판매중지된 상품입니다." };
  if (product.stock < quantity) return { ok: false, error: "재고가 부족합니다." };

  const unitPrice = gb.group_price;
  const subtotal = unitPrice * quantity;
  const rateRaw = Number(product.commission_rate);
  const commissionRate = Number.isFinite(rateRaw) ? rateRaw : DEFAULT_COMMISSION_RATE;
  const commissionAmount = Math.round(subtotal * commissionRate);
  const nowIso = new Date().toISOString();

  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      group_buy_id: groupBuyId,
      toss_order_id: crypto.randomUUID(),
      status: "paid",
      total_amount: subtotal,
      commission_total: commissionAmount,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      address,
      address_detail: addressDetail || null,
      paid_at: nowIso,
    })
    .select("id")
    .single<{ id: string }>();

  if (orderErr || !orderRow) {
    return { ok: false, error: orderErr?.message ?? "주문 생성에 실패했습니다." };
  }

  const { error: itemErr } = await supabase.from("order_items").insert({
    order_id: orderRow.id,
    group_buy_id: groupBuyId,
    product_id: product.id,
    supplier_id: product.supplier_id,
    influencer_id: gb.influencer_id,
    product_name: product.name,
    unit_price: unitPrice,
    quantity,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    subtotal,
  });

  if (itemErr) {
    await admin.from("orders").delete().eq("id", orderRow.id);
    return { ok: false, error: itemErr.message };
  }

  // 재고 차감
  await admin
    .from("products")
    .update({ stock: Math.max(0, product.stock - quantity) })
    .eq("id", product.id);

  // 정산 생성
  const settlementRows = [
    {
      beneficiary_id: product.supplier_id,
      beneficiary_type: "supplier" as const,
      order_id: orderRow.id,
      order_item_id: null as unknown as number,
      gross_amount: subtotal,
      commission_amount: commissionAmount,
      payout_amount: subtotal - commissionAmount,
      status: "pending" as const,
    },
    ...(gb.influencer_id ? [{
      beneficiary_id: gb.influencer_id,
      beneficiary_type: "influencer" as const,
      order_id: orderRow.id,
      order_item_id: null as unknown as number,
      gross_amount: commissionAmount,
      commission_amount: 0,
      payout_amount: commissionAmount,
      status: "pending" as const,
    }] : []),
  ];

  // order_item id 조회 후 settlement 생성
  const { data: itemRow } = await admin
    .from("order_items")
    .select("id")
    .eq("order_id", orderRow.id)
    .single<{ id: number }>();

  if (itemRow) {
    await admin.from("settlements").insert(
      settlementRows.map((r) => ({ ...r, order_item_id: itemRow.id }))
    );
  }

  revalidatePath("/orders");
  revalidatePath(`/group-buys/${groupBuyId}`);
  return { ok: true, orderId: orderRow.id };
}
