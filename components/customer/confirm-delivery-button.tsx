"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { confirmDelivery } from "@/app/actions/orders";

export function ConfirmDeliveryButton({ orderItemId }: { orderItemId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    startTransition(async () => {
      setError(null);
      const res = await confirmDelivery(orderItemId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button size="sm" variant="outline" onClick={onClick} disabled={isPending}>
        {isPending ? "처리 중..." : "수령 확인"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
