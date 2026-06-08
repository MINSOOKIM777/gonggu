"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price_asc", label: "낮은 가격순" },
  { value: "price_desc", label: "높은 가격순" },
];

export function SortSelect({ current }: { current?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "latest") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  return (
    <Select
      value={current ?? "latest"}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-auto min-w-32 text-sm"
      aria-label="정렬 기준"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}
