"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveInfluencerProfile } from "@/app/actions/influencer-profile";
import type { Influencer } from "@/types/db";

type Props = {
  initial: Influencer | null;
  profileId: string;
};

export function InfluencerProfileForm({ initial, profileId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveInfluencerProfile(profileId, formData);
      if (result.ok) setSuccess(true);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-700">공개 프로필</h2>

        <div className="space-y-1.5">
          <Label htmlFor="handle">핸들 (공개 링크)</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">수다공구.com/g/</span>
            <Input
              id="handle"
              name="handle"
              defaultValue={initial?.handle ?? ""}
              placeholder="yourname"
              pattern="[a-zA-Z0-9_.-]+"
              minLength={2}
              maxLength={40}
              required
              className="max-w-xs"
            />
          </div>
          <p className="text-xs text-zinc-400">영문·숫자·_·.·- 만 사용 가능</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">소개</Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={initial?.bio ?? ""}
            placeholder="어떤 콘텐츠를 만드는지 간단히 소개해 주세요."
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-700">채널 링크</h2>
        <p className="text-xs text-zinc-400">활동 채널 링크를 입력해 주세요. 공급자가 신청 검토 시 참고합니다.</p>

        {[
          { id: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/yourhandle", value: initial?.instagram_url },
          { id: "youtube_url", label: "YouTube", placeholder: "https://youtube.com/@yourchannel", value: initial?.youtube_url },
          { id: "tiktok_url", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle", value: initial?.tiktok_url },
          { id: "blog_url", label: "블로그", placeholder: "https://blog.naver.com/yourid", value: initial?.blog_url },
          { id: "other_url", label: "기타 채널", placeholder: "https://...", value: initial?.other_url },
        ].map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              name={field.id}
              type="url"
              defaultValue={field.value ?? ""}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-700">정산 계좌</h2>
        <p className="text-xs text-zinc-400">커미션 정산 시 사용할 계좌 정보를 입력해 주세요.</p>

        <div className="space-y-1.5">
          <Label htmlFor="settlement_bank">은행명</Label>
          <Input
            id="settlement_bank"
            name="settlement_bank"
            defaultValue={initial?.settlement_bank ?? ""}
            placeholder="예: 카카오뱅크"
            maxLength={50}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settlement_account">계좌번호</Label>
          <Input
            id="settlement_account"
            name="settlement_account"
            defaultValue={initial?.settlement_account ?? ""}
            placeholder="숫자만 입력"
            maxLength={30}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">저장되었습니다.</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}
