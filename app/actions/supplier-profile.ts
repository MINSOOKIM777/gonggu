"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SupplierProfileActionResult = { ok: true } | { ok: false; error: string };

export async function saveSupplierProfile(
  formData: FormData,
): Promise<SupplierProfileActionResult> {
  const business_name = String(formData.get("business_name") ?? "").trim();
  const business_number = String(formData.get("business_number") ?? "").trim();
  const settlement_bank = String(formData.get("settlement_bank") ?? "").trim();
  const settlement_account = String(formData.get("settlement_account") ?? "").trim();

  if (!business_name) return { ok: false, error: "상호를 입력해주세요." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { error } = await supabase.from("suppliers").upsert({
    id: user.id,
    business_name,
    business_number: business_number || null,
    settlement_bank: settlement_bank || null,
    settlement_account: settlement_account || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/supplier/profile");
  return { ok: true };
}
