"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/db";

export function CategoryFilter({
  categories,
  currentSlug,
}: {
  categories: Category[];
  currentSlug?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function go(slug?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  const buttonBase =
    "shrink-0 px-4 py-2 rounded-full border text-sm transition-colors whitespace-nowrap";

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      <button
        type="button"
        onClick={() => go(undefined)}
        className={cn(
          buttonBase,
          !currentSlug
            ? "bg-[var(--brand)] text-white border-[var(--brand)]"
            : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400",
        )}
      >
        전체
      </button>
      {categories.map((cat) => {
        const active = currentSlug === cat.slug;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => go(cat.slug)}
            className={cn(
              buttonBase,
              active
                ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400",
            )}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
