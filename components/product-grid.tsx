import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import type { Product } from "@/types/db";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="상품이 없습니다"
        description="조건에 맞는 상품을 찾을 수 없습니다."
      />
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
