"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ShippingAddress } from "@/types/db";

export type AddressActionResult =
  | { ok: true; address: ShippingAddress }
  | { ok: false; error: string };

export type DeleteActionResult = { ok: true } | { ok: false; error: string };

export async function saveShippingAddress(
  formData: FormData,
): Promise<AddressActionResult> {
  const recipient_name = String(formData.get("recipient_name") ?? "").trim();
  const recipient_phone = String(formData.get("recipient_phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const address_detail = String(formData.get("address_detail") ?? "").trim();

  if (!recipient_name) return { ok: false, error: "받는 사람을 입력해주세요." };
  if (!recipient_phone) return { ok: false, error: "연락처를 입력해주세요." };
  if (!address) return { ok: false, error: "주소를 입력해주세요." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { data, error } = await supabase
    .from("shipping_addresses")
    .insert({
      customer_id: user.id,
      recipient_name,
      recipient_phone,
      address,
      address_detail: address_detail || null,
    })
    .select()
    .single<ShippingAddress>();

  if (error || !data) return { ok: false, error: error?.message ?? "저장에 실패했습니다." };

  revalidatePath("/group-buys");
  return { ok: true, address: data };
}

export async function deleteShippingAddress(id: number): Promise<DeleteActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("shipping_addresses")
    .delete()
    .eq("id", id)
    .eq("customer_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/group-buys");
  return { ok: true };
}
