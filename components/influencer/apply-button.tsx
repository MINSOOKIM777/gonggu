"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { applyForProduct } from "@/app/actions/applications";

export function ApplyButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  if (applied) {
    return (
      <div className="text-center text-sm text-green-600 font-medium py-2">
        신청 완료! 검토를 기다려 주세요.
      </div>
    );
  }

  if (!showForm) {
    return (
      <Button
        size="sm"
        className="w-full"
        onClick={() => setShowForm(true)}
        disabled={isPending}
      >
        판매 신청
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder={`"${productName}" 판매 신청 메시지 (선택)\n내 채널에서 어떻게 판매할지 간단히 적어 주세요.`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await applyForProduct(productId, message);
              if (result.ok) setApplied(true);
              else setError(result.error);
            });
          }}
        >
          {isPending ? "신청 중..." : "신청하기"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setShowForm(false); setMessage(""); }}
          disabled={isPending}
        >
          취소
        </Button>
      </div>
    </div>
  );
}
