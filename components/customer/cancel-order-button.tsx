"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelOrder } from "@/app/actions/orders";

export function CancelOrderButton({
  orderId,
  allowed,
}: {
  orderId: string;
  allowed: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    const reason = window.prompt("취소 사유를 입력하세요");
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("취소 사유를 입력해주세요.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await cancelOrder(orderId, trimmed);
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
        variant="outline"
        onClick={onClick}
        disabled={!allowed || isPending}
      >
        {isPending ? "처리 중..." : "주문 취소"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
