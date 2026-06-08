import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import type { OrderStatus } from "@/types/db";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const label = ORDER_STATUS_LABEL[status] ?? status;
  if (status === "paid") return <Badge variant="brand">{label}</Badge>;
  if (status === "failed") return <Badge variant="default">{label}</Badge>;
  if (status === "cancelled") return <Badge variant="muted">{label}</Badge>;
  return <Badge variant="outline">{label}</Badge>;
}
