import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/format";

export function Price({
  value,
  className,
  size = "md",
  brand = false,
}: {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  brand?: boolean;
}) {
  const sizeClass =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : size === "xl" ? "text-3xl" : "text-base";
  return (
    <span
      className={cn(
        "font-bold",
        brand ? "text-[var(--price)]" : "text-zinc-900",
        sizeClass,
        className,
      )}
    >
      {formatKRW(value)}
    </span>
  );
}
