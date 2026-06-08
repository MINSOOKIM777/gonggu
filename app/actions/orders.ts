"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function markShipped(
  orderItemId: number,
  trackingNumber?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();
  if (!profile || profile.role !== "supplier") {
    return { ok: false, error: "공급자만 처리할 수 있습니다." };
  }

  const { data: item } = await supabase
    .from("order_items")
    .select("id, order_id, supplier_id, delivery_status")
    .eq("id", orderItemId)
    .maybeSingle<{
      id: number;
      order_id: string;
      supplier_id: string;
      delivery_status: string;
    }>();

  if (!item) return { ok: false, error: "주문 항목을 찾을 수 없습니다." };
  if (item.supplier_id !== user.id) {
    return { ok: false, error: "본인 상품만 처리할 수 있습니다." };
  }
  if (item.delivery_status !== "ready") {
    return { ok: false, error: "배송 준비 상태에서만 배송을 시작할 수 있습니다." };
  }

  const trimmed = trackingNumber?.trim();
  const { error } = await supabase
    .from("order_items")
    .update({
      delivery_status: "shipped",
      shipped_at: new Date().toISOString(),
      tracking_number: trimmed ? trimmed : null,
    })
    .eq("id", orderItemId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/supplier/orders");
  revalidatePath(`/orders/${item.order_id}`);
  return { ok: true };
}

export async function confirmDelivery(orderItemId: number): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { data: item } = await supabase
    .from("order_items")
    .select("id, order_id, delivery_status, order:orders!inner(id, customer_id)")
    .eq("id", orderItemId)
    .maybeSingle<{
      id: number;
      order_id: string;
      delivery_status: string;
      order: { id: string; customer_id: string } | null;
    }>();

  if (!item || !item.order) {
    return { ok: false, error: "주문 항목을 찾을 수 없습니다." };
  }
  if (item.order.customer_id !== user.id) {
    return { ok: false, error: "본인 주문만 처리할 수 있습니다." };
  }
  if (item.delivery_status !== "shipped") {
    return { ok: false, error: "배송중 상태에서만 수령 확인이 가능합니다." };
  }

  const { error } = await supabase
    .from("order_items")
    .update({
      delivery_status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", orderItemId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/orders/${item.order_id}`);
  return { ok: true };
}

export async function cancelOrder(
  orderId: string,
  reason: string,
): Promise<ActionResult> {
  const trimmed = reason.trim();
  if (!trimmed) return { ok: false, error: "취소 사유를 입력해주세요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, customer_id, status, toss_payment_key, order_items(id, product_id, quantity, delivery_status)",
    )
    .eq("id", orderId)
    .maybeSingle<{
      id: string;
      customer_id: string;
      status: string;
      toss_payment_key: string | null;
      order_items: Array<{
        id: number;
        product_id: string;
        quantity: number;
        delivery_status: string;
      }>;
    }>();

  if (!order) return { ok: false, error: "주문을 찾을 수 없습니다." };
  if (order.customer_id !== user.id) {
    return { ok: false, error: "본인 주문만 취소할 수 있습니다." };
  }

  const items = order.order_items ?? [];
  const nowIso = new Date().toISOString();

  if (order.status === "pending") {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: nowIso,
        cancellation_reason: trimmed,
        cancelled_by: "customer",
      })
      .eq("id", orderId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return { ok: true };
  }

  if (order.status === "paid") {
    const allReady = items.length > 0 && items.every((it) => it.delivery_status === "ready");
    if (!allReady) {
      return { ok: false, error: "배송이 시작된 주문은 취소할 수 없습니다." };
    }
    const service = createServiceClient();

    for (const it of items) {
      const { data: prod } = await service
        .from("products")
        .select("stock")
        .eq("id", it.product_id)
        .maybeSingle<{ stock: number }>();
      if (prod) {
        await service
          .from("products")
          .update({ stock: (prod.stock ?? 0) + it.quantity })
          .eq("id", it.product_id);
      }
    }

    await service.from("settlements").delete().eq("order_id", orderId);

    await service
      .from("order_items")
      .update({ delivery_status: "cancelled" })
      .eq("order_id", orderId);

    const { error: orderErr } = await service
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: nowIso,
        cancellation_reason: trimmed,
        cancelled_by: "customer",
      })
      .eq("id", orderId);
    if (orderErr) return { ok: false, error: orderErr.message };

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return { ok: true };
  }

  return { ok: false, error: "취소할 수 없는 주문 상태입니다." };
}
