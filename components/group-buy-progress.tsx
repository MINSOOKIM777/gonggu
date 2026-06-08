import { cn } from "@/lib/utils";

type Props = {
  current: number;
  target: number;
  percent: number;
  className?: string;
  showLabel?: boolean;
};

export function GroupBuyProgress({
  current,
  target,
  percent,
  className,
  showLabel = true,
}: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn("space-y-1", className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-[var(--brand)] transition-all"
          style={{ width: `${clamped}%` }}
          aria-hidden
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600">
            {current.toLocaleString("ko-KR")}/{target.toLocaleString("ko-KR")}명
          </span>
          <span className="font-semibold text-[var(--brand)]">{clamped}%</span>
        </div>
      )}
    </div>
  );
}
