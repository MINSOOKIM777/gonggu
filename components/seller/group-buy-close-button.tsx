"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { closeGroupBuy } from "@/app/actions/group-buy";

type Props = {
  id: string;
  disabled?: boolean;
};

export function GroupBuyCloseButton({ id, disabled }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (pending || disabled) return;
    if (!window.confirm("공동구매를 지금 마감하시겠습니까?")) return;
    setError(null);
    startTransition(async () => {
      const result = await closeGroupBuy(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={pending || disabled}
      >
        {pending ? "마감 중..." : "지금 마감"}
      </Button>
      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
