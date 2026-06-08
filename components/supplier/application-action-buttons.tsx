"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approveApplication, rejectApplication } from "@/app/actions/applications";

export function ApplicationActionButtons({ applicationId }: { applicationId: number }) {
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveApplication(applicationId);
      if (!result.ok) setError(result.error);
    });
  }

  function handleReject() {
    if (!showReject) {
      setShowReject(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectApplication(applicationId, rejectReason);
      if (!result.ok) setError(result.error);
      else setShowReject(false);
    });
  }

  return (
    <div className="space-y-2">
      {showReject && (
        <Textarea
          placeholder="거절 사유를 입력해 주세요 (선택)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={2}
          className="text-sm"
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={isPending || showReject}
        >
          승인
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={isPending}
        >
          {showReject ? "거절 확인" : "거절"}
        </Button>
        {showReject && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setShowReject(false); setRejectReason(""); }}
            disabled={isPending}
          >
            취소
          </Button>
        )}
      </div>
    </div>
  );
}
