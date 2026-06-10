"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type SignupResult = { ok: true; role: string } | { ok: false; error: string };

export type SignupInput = {
  email: string;
  password: string;
  name: string;
  phone: string | null;
  role: "customer" | "supplier" | "influencer";
  business_name?: string;
  business_number?: string | null;
  settlement_bank?: string | null;
  settlement_account?: string | null;
};

export type SignupSupplierInput = {
  business_name: string;
  business_number: string | null;
  settlement_bank: string | null;
  settlement_account: string | null;
};

export async function signup(input: SignupInput): Promise<SignupResult> {
  const admin = createServiceClient();

  // 이메일 인증 없이 즉시 계정 생성
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { role: input.role, name: input.name, phone: input.phone },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("already been registered")) {
      return { ok: false, error: "이미 사용 중인 이메일입니다." };
    }
    return { ok: false, error: error.message };
  }

  const userId = data.user.id;

  if (input.role === "supplier" && input.business_name?.trim()) {
    await admin.from("suppliers").insert({
      id: userId,
      business_name: input.business_name.trim(),
      business_number: input.business_number?.trim() || null,
      settlement_bank: input.settlement_bank?.trim() || null,
      settlement_account: input.settlement_account?.trim() || null,
    });
  }

  return { ok: true, role: input.role };
}

export async function signupSupplierProfile(input: SignupSupplierInput): Promise<ActionResult> {
  if (!input.business_name?.trim()) return { ok: false, error: "상호를 입력해주세요." };

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, error: "로그인 세션이 확인되지 않습니다." };

  const { error } = await supabase.from("suppliers").upsert({
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
