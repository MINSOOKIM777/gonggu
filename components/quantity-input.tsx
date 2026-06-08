"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  function set(next: number) {
    let n = next;
    if (n < min) n = min;
    if (typeof max === "number" && n > max) n = max;
    onChange(n);
  }

  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-md border border-zinc-300 overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        className="w-9 flex items-center justify-center hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="수량 감소"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isNaN(n)) return;
          set(n);
        }}
        className="w-12 text-center text-sm border-x border-zinc-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={typeof max === "number" && value >= max}
        className="w-9 flex items-center justify-center hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="수량 증가"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
