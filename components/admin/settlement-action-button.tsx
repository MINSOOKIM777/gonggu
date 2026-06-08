"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markSettlementPaid } from "@/app/actions/admin";

export function SettlementActionButton({ settlementId }: { settlementId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!window.confirm("이 정산을 정산완료로 처리할까요?")) return;

    startTransition(async () => {
      setError(null);
      const res = await markSettlementPaid(settlementId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={onClick} disabled={isPending}>
        {isPending ? "처리 중..." : "정산완료 처리"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
