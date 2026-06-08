"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatKRW } from "@/lib/format";
import { Button } from "@/components/ui/button";

export type CartRowItem = {
  id: number;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    image_url: string | null;
    status: "active" | "inactive";
  };
};

export function CartItemRow({ item }: { item: CartRowItem }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const subtotal = item.product.price * item.quantity;
  const outOfStock = item.product.stock <= 0 || item.product.status !== "active";

  async function update(nextQuantity: number) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, quantity: nextQuantity }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body?.error ?? "수량 변경에 실패했습니다.");
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    if (!confirm("장바구니에서 삭제하시겠습니까?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body?.error ?? "삭제에 실패했습니다.");
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  const canIncrease = item.quantity < item.product.stock;

  return (
    <div className="flex gap-4 py-5 border-b border-zinc-200 last:border-b-0">
      <Link
        href={`/products/${item.product.id}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-zinc-100"
      >
        {item.product.image_url ? (
          <Image
            src={item.product.image_url}
            alt={item.product.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-zinc-100" />
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <Link
          href={`/products/${item.product.id}`}
          className="text-sm font-medium text-zinc-900 hover:text-[var(--brand)] line-clamp-2"
        >
          {item.product.name}
        </Link>
        <p className="text-xs text-zinc-500">개당 {formatKRW(item.product.price)}</p>

        {outOfStock && (
          <p className="text-xs text-[var(--brand)]">현재 구매할 수 없는 상품입니다.</p>
        )}

        <div className="mt-auto flex items-center gap-3">
          <div className="inline-flex items-center rounded-md border border-zinc-200">
            <button
              type="button"
              onClick={() => update(item.quantity - 1)}
              disabled={busy || item.quantity <= 1}
              className="h-8 w-8 inline-flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
              aria-label="수량 감소"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="h-8 w-10 inline-flex items-center justify-center text-sm tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => update(item.quantity + 1)}
              disabled={busy || !canIncrease}
              className="h-8 w-8 inline-flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
              aria-label="수량 증가"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={busy}
            className="text-zinc-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
            삭제
          </Button>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-base font-bold text-zinc-900">{formatKRW(subtotal)}</p>
      </div>
    </div>
  );
}
