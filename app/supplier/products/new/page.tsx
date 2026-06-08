import Link from "next/link";
import { requireSupplier } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/seller/product-form";
import { createProduct } from "@/app/actions/supplier-products";
import type { Category } from "@/types/db";

export default async function NewSupplierProductPage() {
  const profile = await requireSupplier();
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("id")
    .returns<Category[]>();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/supplier/products" className="text-sm text-zinc-500 hover:underline">← 상품 관리로</Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">상품 등록</h1>
        <p className="mt-1 text-sm text-zinc-500">인플루언서가 판매 신청할 수 있는 상품을 등록하세요.</p>
      </div>
      <ProductForm
        action={createProduct}
        categories={categories ?? []}
        sellerId={profile.id}
        submitLabel="등록"
      />
    </div>
  );
}
