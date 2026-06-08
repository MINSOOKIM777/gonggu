import Image from "next/image";
import { requireInfluencer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ApplyButton } from "@/components/influencer/apply-button";
import { formatKRW } from "@/lib/format";
import type { Product } from "@/types/db";

export default async function InfluencerProductsPage() {
  const profile = await requireInfluencer();
  const supabase = await createClient();

  // 내가 이미 신청한 product_id 목록
  const { data: myApps } = await supabase
    .from("group_buy_applications")
    .select("product_id, status")
    .eq("influencer_id", profile.id);
  const appliedMap = new Map(
    (myApps ?? []).map((a) => [a.product_id, a.status as string]),
  );

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .returns<Product[]>();

  const products = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">상품 둘러보기</h1>
        <p className="mt-1 text-sm text-zinc-500">
          판매하고 싶은 상품에 신청하세요. 공급자 승인 후 공동구매를 만들 수 있어요.
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState title="등록된 상품이 없습니다" description="공급자가 상품을 등록하면 여기에 표시됩니다." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const appliedStatus = appliedMap.get(p.id);
            return (
              <ProductCard key={p.id} product={p} appliedStatus={appliedStatus} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  appliedStatus,
}: {
  product: Product;
  appliedStatus: string | undefined;
}) {
  const img = product.image_url ?? (product.image_urls?.[0] ?? null);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
      <div className="relative aspect-square w-full bg-zinc-100">
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-zinc-100" />
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="font-medium text-zinc-900 line-clamp-2">{product.name}</p>
          <p className="mt-1 text-lg font-bold text-zinc-900">{formatKRW(product.price)}</p>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <p className="text-xs text-zinc-400 line-through">{formatKRW(product.compare_at_price)}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">재고 {product.stock.toLocaleString("ko-KR")}개</span>
          <span className="text-xs text-zinc-500">수수료 {(Number(product.commission_rate) * 100).toFixed(0)}%</span>
        </div>
        {appliedStatus ? (
          <Badge
            variant={
              appliedStatus === "approved" ? "brand" : appliedStatus === "rejected" ? "muted" : "default"
            }
            className="w-full justify-center py-1.5"
          >
            {appliedStatus === "approved" ? "승인됨" : appliedStatus === "rejected" ? "거절됨" : "신청 검토중"}
          </Badge>
        ) : (
          <ApplyButton productId={product.id} productName={product.name} />
        )}
      </div>
    </div>
  );
}
