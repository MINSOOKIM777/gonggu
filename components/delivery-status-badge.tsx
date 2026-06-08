import { Badge } from "@/components/ui/badge";
import { DELIVERY_STATUS_LABEL } from "@/lib/constants";
import type { DeliveryStatus } from "@/types/db";

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const label = DELIVERY_STATUS_LABEL[status] ?? status;
  if (status === "ready") return <Badge variant="muted">{label}</Badge>;
  if (status === "shipped") return <Badge variant="outline">{label}</Badge>;
  if (status === "delivered") return <Badge variant="brand">{label}</Badge>;
  return <Badge variant="default">{label}</Badge>;
}
