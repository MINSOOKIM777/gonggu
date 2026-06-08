"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

export async function saveInfluencerProfile(
  profileId: string,
  formData: FormData,
): Promise<ProfileActionResult> {
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  const bio = String(formData.get("bio") ?? "").trim();
  const instagram_url = String(formData.get("instagram_url") ?? "").trim();
  const youtube_url = String(formData.get("youtube_url") ?? "").trim();
  const tiktok_url = String(formData.get("tiktok_url") ?? "").trim();
  const blog_url = String(formData.get("blog_url") ?? "").trim();
  const other_url = String(formData.get("other_url") ?? "").trim();
  const settlement_bank = String(formData.get("settlement_bank") ?? "").trim();
  const settlement_account = String(formData.get("settlement_account") ?? "").trim();

  if (!handle) return { ok: false, error: "핸들을 입력해 주세요." };
  if (handle.length < 2) return { ok: false, error: "핸들은 2자 이상이어야 합니다." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== profileId) return { ok: false, error: "로그인이 필요합니다." };

  const { error } = await supabase.from("influencers").upsert({
    id: profileId,
    handle,
    bio: bio || null,
    instagram_url: instagram_url || null,
    youtube_url: youtube_url || null,
    tiktok_url: tiktok_url || null,
    blog_url: blog_url || null,
    other_url: other_url || null,
    settlement_bank: settlement_bank || null,
    settlement_account: settlement_account || null,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, error: "이미 사용 중인 핸들입니다." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/influencer/profile");
  revalidatePath(`/g/${handle}`);
  return { ok: true };
}
