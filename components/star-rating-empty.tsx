import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingEmpty({
  count = 0,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="w-3 h-3 text-zinc-200 fill-zinc-200"
          />
        ))}
      </div>
      <span className="text-[11px] text-zinc-400">({count})</span>
    </div>
  );
}
