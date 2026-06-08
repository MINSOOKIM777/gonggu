import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSupplier } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/seller/product-form";
import { Button } from "@/components/ui/button";
import { updateProduct, deleteProduct } from "@/app/actions/supplier-products";
import type { Category, Product } from "@/types/db";

export default async function EditSupplierProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireSupplier();
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).eq("supplier_id", profile.id).maybeSingle<Product>(),
    supabase.from("categories").select("*").order("id").returns<Category[]>(),
  ]);

  if (!product) notFound();

  const updateAction = updateProduct.bind(null, product.id);
  const deleteAction = deleteProduct.bind(null, product.id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/supplier/products" className="text-sm text-zinc-500 hover:underline">← 상품 관리로</Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">상품 수정</h1>
      </div>
      <ProductForm
        action={updateAction}
        categories={categories ?? []}
        sellerId={profile.id}
        initial={product}
        submitLabel="저장"
      />
      <div className="border-t border-zinc-200 pt-6">
        <h2 className="text-sm font-semibold text-red-700">위험 작업</h2>
        <p className="mt-1 text-xs text-zinc-500">상품을 영구 삭제합니다. 되돌릴 수 없습니다.</p>
        <form action={deleteAction} className="mt-3">
          <Button type="submit" variant="destructive" size="sm">상품 삭제</Button>
        </form>
      </div>
    </div>
  );
}
