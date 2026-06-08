"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatKRW } from "@/lib/format";
import type { GroupBuy } from "@/types/db";
import type { GroupBuyActionResult } from "@/app/actions/group-buy";

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

type Props = {
  action: (formData: FormData) => Promise<GroupBuyActionResult>;
  products: ProductOption[];
  initial?: GroupBuy;
  initialProductId?: string;
  applicationId?: number;
  submitLabel?: string;
};

function toLocalInput(value: string | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function defaultStartLocal(): string {
  return toLocalInput(new Date().toISOString());
}

function defaultEndLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toLocalInput(d.toISOString());
}

export function GroupBuyForm({
  action,
  products,
  initial,
  initialProductId,
  applicationId,
  submitLabel = "저장",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string>(
    initial?.product_id ?? initialProductId ?? products[0]?.id ?? "",
  );
  const [groupPrice, setGroupPrice] = useState<string>(
    initial?.group_price?.toString() ?? "",
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  const groupPriceNum = Number(groupPrice);
  const showDiscount =
    selectedProduct &&
    Number.isFinite(groupPriceNum) &&
    groupPriceNum > 0 &&
    groupPriceNum < selectedProduct.price;
  const discountPct = showDiscount
    ? Math.round(
        ((selectedProduct!.price - groupPriceNum) / selectedProduct!.price) *
          100,
      )
    : 0;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result && !result.ok) {
          setError(result.error);
        }
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message === "NEXT_REDIRECT" ||
            (err as { digest?: string }).digest?.toString().startsWith("NEXT_REDIRECT"))
        ) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {applicationId !== undefined && (
        <input type="hidden" name="application_id" value={applicationId} />
      )}
      <div className="space-y-2">
        <Label htmlFor="product_id">상품</Label>
        <Select
          id="product_id"
          name="product_id"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        >
          <option value="">상품을 선택해 주세요</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({formatKRW(p.price)})
            </option>
          ))}
        </Select>
        {selectedProduct && (
          <p className="text-xs text-zinc-500">
            정가: {formatKRW(selectedProduct.price)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          placeholder="공동구매 제목을 입력하세요"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="공동구매에 대한 설명을 입력하세요"
          rows={5}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="group_price">공구 판매가 (원)</Label>
          <Input
            id="group_price"
            name="group_price"
            type="number"
            min={0}
            step={1}
            required
            value={groupPrice}
            onChange={(e) => setGroupPrice(e.target.value)}
            placeholder="0"
          />
          {showDiscount && (
            <p className="text-xs text-[var(--brand)] font-medium">
              정가 대비 {discountPct}% 할인
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="target_quantity">목표 수량</Label>
          <Input
            id="target_quantity"
            name="target_quantity"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={initial?.target_quantity ?? 10}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="max_per_user">1인 최대 구매 수량</Label>
          <Input
            id="max_per_user"
            name="max_per_user"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={initial?.max_per_user ?? 1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_at">시작일시</Label>
          <Input
            id="start_at"
            name="start_at"
            type="datetime-local"
            defaultValue={
              initial ? toLocalInput(initial.start_at) : defaultStartLocal()
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_at">마감일시</Label>
          <Input
            id="end_at"
            name="end_at"
            type="datetime-local"
            required
            defaultValue={
              initial ? toLocalInput(initial.end_at) : defaultEndLocal()
            }
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
