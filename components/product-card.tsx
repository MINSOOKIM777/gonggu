import Image from "next/image";
import Link from "next/link";
import { formatKRW } from "@/lib/format";
import { StarRatingEmpty } from "@/components/star-rating-empty";
import type { Product } from "@/types/db";

export function ProductCard({ product }: { product: Product }) {
  const fallbackImage =
    product.image_url ??
    (product.image_urls && product.image_urls.length > 0
      ? product.image_urls[0]
      : null);

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

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-white rounded-md overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
        {fallbackImage ? (
          <Image
            src={fallbackImage}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-zinc-100" />
        )}
      </div>
      <div className="flex flex-col gap-1 p-2">
        <p className="line-clamp-2 text-sm text-zinc-700 min-h-[2.5rem] leading-tight">
          {product.name}
        </p>

        {hasDiscount && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[var(--price)] text-sm font-bold">
              {discountPercent}%
            </span>
            <span className="text-xs text-zinc-400 line-through">
              {formatKRW(product.compare_at_price!)}
            </span>
          </div>
        )}

        <div className="text-lg font-bold text-zinc-900 leading-tight">
          {formatKRW(product.price)}
        </div>

        <span className="text-[10px] text-zinc-500">무료배송</span>

        <StarRatingEmpty />
      </div>
    </Link>
  );
}
