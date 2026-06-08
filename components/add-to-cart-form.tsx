"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuantityInput } from "@/components/quantity-input";

export function AddToCartForm({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const outOfStock = stock <= 0;

  async function submit(buyNow: boolean) {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        alert(text || "장바구니 담기에 실패했습니다.");
        return;
      }

      if (buyNow) {
        router.push("/cart");
      } else {
        alert("장바구니에 담겼습니다");
        startTransition(() => router.refresh());
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-700">수량</span>
        <QuantityInput
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={stock > 0 ? stock : undefined}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={pending || outOfStock}
          onClick={() => submit(false)}
        >
          장바구니 담기
        </Button>
        <Button
          type="button"
          variant="default"
          size="lg"
          className="flex-1"
          disabled={pending || outOfStock}
          onClick={() => submit(true)}
        >
          {outOfStock ? "품절" : "바로 구매"}
        </Button>
      </div>
    </div>
  );
}
