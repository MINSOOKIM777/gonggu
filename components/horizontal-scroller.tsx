import { cn } from "@/lib/utils";

export function HorizontalScroller({
  children,
  className,
  itemClassName = "w-[180px]",
}: {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  const childArray = Array.isArray(children) ? children : [children];
  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4",
        "scrollbar-thin",
        className,
      )}
    >
      {childArray.map((child, i) => (
        <div
          key={i}
          className={cn(
            "shrink-0 snap-start",
            itemClassName,
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
