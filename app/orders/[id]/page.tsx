import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { DeliveryStatusBadge } from "@/components/delivery-status-badge";
import { ConfirmDeliveryButton } from "@/components/customer/confirm-delivery-button";
import { CancelOrderButton } from "@/components/customer/cancel-order-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatKRW, formatDate } from "@/lib/format";
import type { OrderStatus, DeliveryStatus, CancelledBy } from "@/types/db";

type OrderItemDetail = {
  id: number;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  commission_amount: number;
  delivery_status: DeliveryStatus;
  shipped_at: string | null;
  delivered_at: string | null;
  tracking_number: string | null;
  product: { image_url: string | null } | null;
};

type OrderDetail = {
  id: string;
  customer_id: string;
  toss_order_id: string;
  toss_payment_key: string | null;
  status: OrderStatus;
  total_amount: number;
  commission_total: number;
  recipient_name: string;
  recipient_phone: string;
  address: string;
  address_detail: string | null;
  created_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancelled_by: CancelledBy | null;
  order_items: OrderItemDetail[];
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, customer_id, toss_order_id, toss_payment_key, status, total_amount, commission_total,
       recipient_name, recipient_phone, address, address_detail, created_at, paid_at,
       cancelled_at, cancellation_reason, cancelled_by,
       order_items(id, product_id, product_name, unit_price, quantity, subtotal, commission_amount,
         delivery_status, shipped_at, delivered_at, tracking_number,
         product:products(image_url))`,
    )
    .eq("id", id)
    .maybeSingle<OrderDetail>();

  if (!order || order.customer_id !== user.id) notFound();

  const items = order.order_items ?? [];

  const allReady = items.length > 0 && items.every((it) => it.delivery_status === "ready");
  const allDelivered = items.length > 0 && items.every((it) => it.delivery_status === "delivered");
  const cancelAllowed =
    order.status === "pending" || (order.status === "paid" && allReady);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">주문 상세</h1>
          <p className="mt-1 text-xs text-zinc-500">주문번호: {order.toss_order_id}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <OrderStatusBadge status={order.status} />
          {order.status !== "cancelled" && order.status !== "failed" && (
            <CancelOrderButton orderId={order.id} allowed={cancelAllowed} />
          )}
        </div>
      </div>

      {order.status === "cancelled" && (
        <Card>
          <CardHeader>
            <CardTitle>취소된 주문</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-700 space-y-1">
            {order.cancelled_at && (
              <p>
                <span className="text-zinc-500">취소일시</span> · {formatDate(order.cancelled_at)}
              </p>
            )}
            {order.cancellation_reason && (
              <p>
                <span className="text-zinc-500">취소 사유</span> · {order.cancellation_reason}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {allDelivered && order.status === "paid" && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          구매 확정 완료. 이용해주셔서 감사합니다.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>배송지</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-700 space-y-1">
          <p>
            <span className="text-zinc-500">받는 사람</span> · {order.recipient_name} ({order.recipient_phone})
          </p>
          <p>
            <span className="text-zinc-500">주소</span> · {order.address}
            {order.address_detail ? ` ${order.address_detail}` : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>주문 상품</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-y border-zinc-200 bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">상품</th>
                <th className="px-4 py-2 font-medium text-right">단가</th>
                <th className="px-4 py-2 font-medium text-right">수량</th>
                <th className="px-4 py-2 font-medium text-right">합계</th>
                <th className="px-4 py-2 font-medium">배송 상태</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-zinc-100 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {it.product?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.product.image_url}
                          alt={it.product_name}
                          className="h-12 w-12 rounded-md object-cover border border-zinc-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-zinc-100" />
                      )}
                      <Link
                        href={`/products/${it.product_id}`}
                        className="text-zinc-900 hover:underline"
                      >
                        {it.product_name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700">{formatKRW(it.unit_price)}</td>
                  <td className="px-4 py-3 text-right text-zinc-700">{it.quantity}</td>
                  <td className="px-4 py-3 text-right text-zinc-900 font-medium">
                    {formatKRW(it.subtotal)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-2">
                      <DeliveryStatusBadge status={it.delivery_status} />
                      {it.delivery_status === "shipped" && (
                        <>
                          {it.tracking_number && (
                            <p className="text-xs text-zinc-500">
                              운송장 {it.tracking_number}
                            </p>
                          )}
                          <ConfirmDeliveryButton orderItemId={it.id} />
                        </>
                      )}
                      {it.delivery_status === "delivered" && it.tracking_number && (
                        <p className="text-xs text-zinc-500">
                          운송장 {it.tracking_number}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>결제 정보</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-600">주문일시</span>
            <span className="text-zinc-900">{formatDate(order.created_at)}</span>
          </div>
          {order.paid_at && (
            <div className="flex justify-between">
              <span className="text-zinc-600">결제일시</span>
              <span className="text-zinc-900">{formatDate(order.paid_at)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-600">상품 금액</span>
            <span className="text-zinc-900">{formatKRW(order.total_amount)}</span>
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>(플랫폼 수수료 포함)</span>
            <span>{formatKRW(order.commission_total)}</span>
          </div>
          <div className="border-t border-zinc-200 pt-2 mt-2 flex justify-between items-baseline">
            <span className="text-sm text-zinc-700">결제금액</span>
            <span className="text-xl font-bold text-[var(--price)]">
              {formatKRW(order.total_amount)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Link href="/orders">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    </div>
  );
}
