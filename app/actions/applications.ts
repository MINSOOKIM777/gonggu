"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ApplicationActionResult = { ok: true } | { ok: false; error: string };

export async function applyForProduct(
  productId: string,
  message: string,
): Promise<ApplicationActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { error } = await supabase.from("group_buy_applications").insert({
    influencer_id: user.id,
    product_id: productId,
    message: message.trim() || null,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "이미 신청한 상품입니다." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/influencer/applications");
  revalidatePath("/influencer/products");
  return { ok: true };
}

export async function approveApplication(
  applicationId: number,
): Promise<ApplicationActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  // 본인 상품의 신청인지 확인
  const { data: app } = await supabase
    .from("group_buy_applications")
    .select("id, product:products(supplier_id)")
    .eq("id", applicationId)
    .maybeSingle<{ id: number; product: { supplier_id: string } | null }>();

  if (!app || app.product?.supplier_id !== user.id) {
    return { ok: false, error: "처리 권한이 없습니다." };
  }

  const { error } = await supabase
    .from("group_buy_applications")
    .update({ status: "approved" })
    .eq("id", applicationId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/supplier/applications");
  return { ok: true };
}

export async function rejectApplication(
  applicationId: number,
  reason: string,
): Promise<ApplicationActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { data: app } = await supabase
    .from("group_buy_applications")
    .select("id, product:products(supplier_id)")
    .eq("id", applicationId)
    .maybeSingle<{ id: number; product: { supplier_id: string } | null }>();

  if (!app || app.product?.supplier_id !== user.id) {
    return { ok: false, error: "처리 권한이 없습니다." };
  }

  const { error } = await supabase
    .from("group_buy_applications")
    .update({ status: "rejected", rejected_reason: reason.trim() || null })
    .eq("id", applicationId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/supplier/applications");
  return { ok: true };
}
