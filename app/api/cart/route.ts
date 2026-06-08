import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { productId?: string; quantity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : null;
  const quantity = Number.isFinite(body.quantity as number) ? Math.floor(Number(body.quantity)) : 0;

  if (!productId || quantity <= 0) {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock, status")
    .eq("id", productId)
    .maybeSingle<{ id: string; stock: number; status: "active" | "inactive" }>();

  if (productError || !product) {
    return NextResponse.json({ ok: false, error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  if (product.status !== "active") {
    return NextResponse.json({ ok: false, error: "판매 중인 상품이 아닙니다." }, { status: 400 });
  }
  if (product.stock <= 0) {
    return NextResponse.json({ ok: false, error: "재고가 없습니다." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("customer_id", user.id)
    .eq("product_id", productId)
    .maybeSingle<{ id: number; quantity: number }>();

  if (existing) {
    const nextQuantity = Math.min(existing.quantity + quantity, product.stock);
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQuantity })
      .eq("id", existing.id)
      .eq("customer_id", user.id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const insertQuantity = Math.min(quantity, product.stock);
  const { error } = await supabase.from("cart_items").insert({
    customer_id: user.id,
    product_id: productId,
    quantity: insertQuantity,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { id?: number; quantity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const id = Number.isFinite(body.id as number) ? Number(body.id) : null;
  const quantity = Number.isFinite(body.quantity as number) ? Math.floor(Number(body.quantity)) : null;
  if (id === null || quantity === null) {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (quantity <= 0) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", id)
      .eq("customer_id", user.id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Cap at product stock for safety.
  const { data: item } = await supabase
    .from("cart_items")
    .select("id, product_id")
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle<{ id: number; product_id: string }>();

  if (!item) {
    return NextResponse.json({ ok: false, error: "장바구니 항목을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("stock")
    .eq("id", item.product_id)
    .maybeSingle<{ stock: number }>();

  const capped = product ? Math.min(quantity, Math.max(product.stock, 1)) : quantity;

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: capped })
    .eq("id", id)
    .eq("customer_id", user.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const id = Number.isFinite(body.id as number) ? Number(body.id) : null;
  if (id === null) {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", id)
    .eq("customer_id", user.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
