import { requireInfluencer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InfluencerProfileForm } from "@/components/influencer/profile-form";
import type { Influencer } from "@/types/db";

export default async function InfluencerProfilePage() {
  const profile = await requireInfluencer();
  const supabase = await createClient();

  const { data: influencer } = await supabase
    .from("influencers")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle<Influencer>();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">채널 정보</h1>
        <p className="mt-1 text-sm text-zinc-500">
          공개 프로필 주소와 SNS 채널을 등록하세요. 구매자들이 내 링크를 통해 공동구매에 참여합니다.
        </p>
      </div>
      <InfluencerProfileForm initial={influencer} profileId={profile.id} />
    </div>
  );
}
