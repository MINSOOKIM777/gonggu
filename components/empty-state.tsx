import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <p className="text-lg font-semibold text-zinc-900">{title}</p>
      {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
