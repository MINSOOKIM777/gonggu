"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type SignupSupplierInput = {
  business_name: string;
  business_number: string | null;
  settlement_bank: string | null;
  settlement_account: string | null;
};

export async function signupSupplierProfile(input: SignupSupplierInput): Promise<ActionResult> {
  if (!input.business_name?.trim()) return { ok: false, error: "상호를 입력해주세요." };

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, error: "로그인 세션이 확인되지 않습니다." };

  const { error } = await supabase.from("suppliers").insert({
    id: user.id,
    business_name: input.business_name.trim(),
    business_number: input.business_number?.trim() || null,
    settlement_bank: input.settlement_bank?.trim() || null,
    settlement_account: input.settlement_account?.trim() || null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signupSellerProfile(input: SignupSupplierInput): Promise<ActionResult> {
  return signupSupplierProfile(input);
}
