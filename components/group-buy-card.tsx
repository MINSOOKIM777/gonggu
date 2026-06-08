import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GroupBuyProgress } from "@/components/group-buy-progress";
import { formatKRW } from "@/lib/format";
import {
  discountPercent,
  formatRemaining,
  progressPercent,
} from "@/lib/group-buy";
import type { GroupBuy } from "@/types/db";

type Props = {
  groupBuy: GroupBuy;
  product: {
    name: string;
    image_url: string | null;
    image_urls: string[];
    price: number;
  };
  currentQuantity: number;
};

export function GroupBuyCard({ groupBuy, product, currentQuantity }: Props) {
  const fallbackImage =
    product.image_url ??
    (product.image_urls && product.image_urls.length > 0
      ? product.image_urls[0]
      : null);

  const percent = progressPercent(currentQuantity, groupBuy.target_quantity);
  const discount = discountPercent(product.price, groupBuy.group_price);
  const remaining = formatRemaining(groupBuy.end_at);

  return (
    <Link
      href={`/group-buys/${groupBuy.id}`}
      className="group block bg-white rounded-md overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
        {fallbackImage ? (
          <Image
            src={fallbackImage}
            alt={groupBuy.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-zinc-100" />
        )}
        <Badge variant="brand" className="absolute left-2 top-2">
          공동구매
        </Badge>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-tight text-zinc-700">
          {groupBuy.title}
        </p>

        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-400 line-through">
            정가 {formatKRW(product.price)}
          </span>
          <div className="flex items-baseline gap-1.5">
            {discount > 0 && (
              <span className="text-sm font-bold text-[var(--price)]">
                {discount}%
              </span>
            )}
            <span className="text-lg font-bold text-zinc-900">
              {formatKRW(groupBuy.group_price)}
            </span>
          </div>
        </div>

        <GroupBuyProgress
          current={currentQuantity}
          target={groupBuy.target_quantity}
          percent={percent}
          showLabel={false}
        />
        <div className="flex items-center justify-between text-[11px] text-zinc-600">
          <span>
            {currentQuantity}/{groupBuy.target_quantity}명 모집
          </span>
          <span className="text-[var(--brand)] font-medium">{remaining}</span>
        </div>
      </div>
    </Link>
  );
}
