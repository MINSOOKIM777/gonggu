import Link from "next/link";
import { redirect } from "next/navigation";
import { requireInfluencer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GroupBuyForm } from "@/components/seller/group-buy-form";
import { createGroupBuy } from "@/app/actions/group-buy";
import type { Product } from "@/types/db";

export default async function NewInfluencerGroupBuyPage({
  searchParams,
}: {
  searchParams: Promise<{ product_id?: string; application_id?: string }>;
}) {
  const profile = await requireInfluencer();
  const { product_id, application_id } = await searchParams;

  if (!product_id) redirect("/influencer/applications");

  const supabase = await createClient();

  // 승인된 신청인지 확인
  const { data: app } = await supabase
    .from("group_buy_applications")
    .select("id, status")
    .eq("influencer_id", profile.id)
    .eq("product_id", product_id)
    .eq("status", "approved")
    .maybeSingle();

  if (!app) redirect("/influencer/applications");

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .maybeSingle<Product>();

  if (!product) redirect("/influencer/applications");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/influencer/applications" className="text-sm text-zinc-500 hover:underline">← 신청 내역으로</Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">공동구매 개설</h1>
        <p className="mt-1 text-sm text-zinc-500">
          승인된 상품: <span className="font-medium text-zinc-900">{product.name}</span>
        </p>
      </div>

      {/* application_id, product_id hidden input 포함 */}
      <input type="hidden" name="application_id" value={app.id} form="gb-form" />
      <GroupBuyForm
        action={createGroupBuy}
        products={[{ id: product.id, name: product.name, price: product.price }]}
        initialProductId={product.id}
        applicationId={app.id}
        submitLabel="공동구매 개설"
      />
    </div>
  );
}
