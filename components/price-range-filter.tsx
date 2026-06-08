"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PriceRangeFilter({
  initialMin,
  initialMax,
}: {
  initialMin?: string;
  initialMax?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(initialMin ?? "");
  const [max, setMax] = useState(initialMax ?? "");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmedMin = min.trim();
    const trimmedMax = max.trim();
    if (trimmedMin && Number.isFinite(Number(trimmedMin))) {
      params.set("min_price", trimmedMin);
    } else {
      params.delete("min_price");
    }
    if (trimmedMax && Number.isFinite(Number(trimmedMax))) {
      params.set("max_price", trimmedMax);
    } else {
      params.delete("max_price");
    }
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  function onReset() {
    setMin("");
    setMax("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("min_price");
    params.delete("max_price");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  const hasActiveFilter = (initialMin ?? "") !== "" || (initialMax ?? "") !== "";

  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center gap-2 text-sm"
    >
      <span className="text-zinc-500 shrink-0">가격</span>
      <Input
        type="number"
        min={0}
        step={1}
        value={min}
        onChange={(e) => setMin(e.target.value)}
        placeholder="최소"
        className="h-9 w-24 text-sm"
        aria-label="최소 가격"
      />
      <span className="text-zinc-400">~</span>
      <Input
        type="number"
        min={0}
        step={1}
        value={max}
        onChange={(e) => setMax(e.target.value)}
        placeholder="최대"
        className="h-9 w-24 text-sm"
        aria-label="최대 가격"
      />
      <Button type="submit" size="sm" variant="outline">
        적용
      </Button>
      {hasActiveFilter && (
        <Button type="button" size="sm" variant="ghost" onClick={onReset}>
          초기화
        </Button>
      )}
    </form>
  );
}
