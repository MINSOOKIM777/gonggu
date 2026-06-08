import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/product-gallery";
import { ProductTabs } from "@/components/product-tabs";
import { StarRatingEmpty } from "@/components/star-rating-empty";
import { formatKRW } from "@/lib/format";
import type { Product, Category } from "@/types/db";

function formatDeliveryDate(date: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = days[date.getDay()];
  return `${month}월 ${day}일(${weekday})`;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUser();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle<Product>();

  if (!product) notFound();
  if (product.status !== "active" && product.supplier_id !== user?.id) {
    notFound();
  }

  const { data: supplierProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", product.supplier_id)
    .maybeSingle<{ name: string }>();

  const { data: supplierRow } = await supabase
    .from("suppliers")
    .select("business_name")
    .eq("id", product.supplier_id)
    .maybeSingle<{ business_name: string }>();

  const sellerLabel =
    supplierRow?.business_name ?? supplierProfile?.name ?? "공급자";

  let category: Category | null = null;
  if (product.category_id) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("id", product.category_id)
      .maybeSingle<Category>();
    category = data ?? null;
  }

  // Build images array: image_url + image_urls (dedupe).
  const images: string[] = [];
  if (product.image_url) images.push(product.image_url);
  if (product.image_urls && product.image_urls.length > 0) {
    for (const url of product.image_urls) {
      if (!images.includes(url)) images.push(url);
    }
  }

  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined &&
    product.compare_at_price > product.price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) /
          product.compare_at_price!) *
          100,
      )
    : 0;

  // Delivery date: today + 2 days
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 2);
  const deliveryLabel = formatDeliveryDate(deliveryDate);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-8">
        <div>
          <ProductGallery images={images} alt={product.name} />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500">
            <Link href="/products" className="hover:underline">
              전체
            </Link>
            {category && (
              <>
                {" > "}
                <Link
                  href={`/products?category=${category.slug}`}
                  className="hover:underline"
                >
                  {category.name}
                </Link>
              </>
            )}
          </p>

          <h1 className="text-xl font-medium text-zinc-900 leading-snug">
            {product.name}
          </h1>

          <Link
            href="#"
            className="text-xs text-zinc-500 hover:underline w-fit"
          >
            {sellerLabel}
          </Link>

          <StarRatingEmpty count={0} />

          <Separator className="my-2" />

          <div className="flex flex-col gap-1">
            {hasDiscount ? (
              <>
                <span className="text-xs text-zinc-400 line-through">
                  {formatKRW(product.compare_at_price!)}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[var(--price)]">
                    {discountPercent}%
                  </span>
                  <span className="text-3xl font-bold text-zinc-900">
                    {formatKRW(product.price)}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--price)] font-medium">
                  최저가
                </span>
              </>
            ) : (
              <div className="text-3xl font-bold text-zinc-900">
                {formatKRW(product.price)}
              </div>
            )}
          </div>

          <div className="text-sm text-zinc-700 mt-1">
            <span className="font-medium text-zinc-900">무료배송</span>
            <span className="mx-1.5 text-zinc-300">·</span>
            <span>도착예정 {deliveryLabel}</span>
          </div>

          <Separator className="my-2" />

          <div className="text-sm">
            {product.stock > 0 ? (
              <span className="text-zinc-700">
                재고 {product.stock.toLocaleString("ko-KR")}개
              </span>
            ) : (
              <span className="text-[var(--brand)] font-medium">품절</span>
            )}
          </div>

          <div className="mt-2 rounded-md bg-zinc-50 border border-zinc-200 p-3 text-sm text-zinc-600">
            이 상품은 인플루언서 공동구매를 통해 구매할 수 있습니다.
          </div>
        </div>
      </div>

      <section className="mt-12">
        <ProductTabs description={product.description} />
      </section>
    </div>
  );
}
