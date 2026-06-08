import Link from "next/link";
import { requireSupplier } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatKRW } from "@/lib/format";
import type { Product } from "@/types/db";

export default async function SupplierProductsPage() {
  const profile = await requireSupplier();
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("supplier_id", profile.id)
    .order("created_at", { ascending: false });

  const list: Product[] = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">상품 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">총 {list.length.toLocaleString("ko-KR")}개</p>
        </div>
        <Link href="/supplier/products/new">
          <Button>+ 상품 등록</Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="등록된 상품이 없습니다"
          description="첫 상품을 등록하면 인플루언서들이 판매 신청을 할 수 있어요."
          action={<Link href="/supplier/products/new"><Button>+ 상품 등록</Button></Link>}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">이미지</th>
                <th className="px-4 py-3 font-medium">상품명</th>
                <th className="px-4 py-3 font-medium text-right">가격</th>
                <th className="px-4 py-3 font-medium text-right">재고</th>
                <th className="px-4 py-3 font-medium text-right">수수료율</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-md object-cover border border-zinc-200" />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-zinc-100" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-900">{p.name}</td>
                  <td className="px-4 py-3 text-right">{formatKRW(p.price)}</td>
                  <td className="px-4 py-3 text-right">{p.stock.toLocaleString("ko-KR")}</td>
                  <td className="px-4 py-3 text-right">{(Number(p.commission_rate) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    {p.status === "active" ? (
                      <Badge variant="brand">판매중</Badge>
                    ) : (
                      <Badge variant="muted">미판매</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/supplier/products/${p.id}/edit`} className="text-sm text-[var(--brand)] hover:underline">
                      수정
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
