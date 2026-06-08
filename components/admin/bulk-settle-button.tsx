"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markAllPendingSettlementsPaid } from "@/app/actions/admin";

export function BulkSettleButton({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (pendingCount === 0) return;
    if (
      !window.confirm(
        `정산 대기 중인 ${pendingCount}건을 모두 정산완료로 처리할까요?`,
      )
    )
      return;

    startTransition(async () => {
      setError(null);
      const res = await markAllPendingSettlementsPaid();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        onClick={onClick}
        disabled={isPending || pendingCount === 0}
      >
        {isPending ? "처리 중..." : `전체 일괄 정산완료 (${pendingCount}건)`}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
