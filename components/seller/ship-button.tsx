"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markShipped } from "@/app/actions/orders";

export function ShipButton({ orderItemId }: { orderItemId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    const tracking = window.prompt("운송장 번호를 입력하세요 (선택)") ?? "";
    const trackingNumber = tracking.trim() ? tracking.trim() : undefined;

    startTransition(async () => {
      setError(null);
      const res = await markShipped(orderItemId, trackingNumber);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button size="sm" variant="default" onClick={onClick} disabled={isPending}>
        {isPending ? "처리 중..." : "배송 시작"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
