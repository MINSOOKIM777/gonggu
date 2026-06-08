import { requireSupplier } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { DeliveryStatusBadge } from "@/components/delivery-status-badge";
import { ShipButton } from "@/components/seller/ship-button";
import { formatKRW, formatDate } from "@/lib/format";
import type { DeliveryStatus } from "@/types/db";

type OrderItemRow = {
  id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  commission_amount: number;
  delivery_status: DeliveryStatus;
  shipped_at: string | null;
  delivered_at: string | null;
  tracking_number: string | null;
  order: {
    id: string;
    toss_order_id: string;
    status: string;
    paid_at: string | null;
    recipient_name: string;
    recipient_phone: string;
    address: string;
    address_detail: string | null;
  } | null;
};

export default async function SupplierOrdersPage() {
  const profile = await requireSupplier();
  const supabase = await createClient();

  const { data } = await supabase
    .from("order_items")
    .select(
      `id, product_name, unit_price, quantity, subtotal, commission_amount,
       delivery_status, shipped_at, delivered_at, tracking_number,
       order:orders!inner(id, toss_order_id, status, paid_at, recipient_name, recipient_phone, address, address_detail)`,
    )
    .eq("supplier_id", profile.id)
    .eq("orders.status", "paid")
    .order("paid_at", { foreignTable: "orders", ascending: false })
    .returns<OrderItemRow[]>();

  const rows = (data ?? []).filter(
    (r): r is OrderItemRow & { order: NonNullable<OrderItemRow["order"]> } => !!r.order,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">주문</h1>
        <p className="mt-1 text-sm text-zinc-500">
          총 {rows.length.toLocaleString("ko-KR")}건 (결제완료 기준)
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="주문 내역이 없습니다" description="결제 완료된 주문만 표시됩니다." />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-zinc-900">{row.product_name}</p>
                  <p className="text-sm text-zinc-500">
                    {formatKRW(row.unit_price)} × {row.quantity}개 = {formatKRW(row.subtotal)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    수수료: {formatKRW(row.commission_amount)} | 결제: {formatDate(row.order.paid_at ?? "")}
                  </p>
                </div>
                <DeliveryStatusBadge status={row.delivery_status} />
              </div>
              <div className="text-sm text-zinc-600 bg-zinc-50 rounded-md p-3">
                <p>{row.order.recipient_name} / {row.order.recipient_phone}</p>
                <p>{row.order.address} {row.order.address_detail}</p>
              </div>
              {row.delivery_status === "ready" && (
                <ShipButton orderItemId={row.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
