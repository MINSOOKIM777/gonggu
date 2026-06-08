import { requireSupplier } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SupplierProfileForm } from "@/components/supplier/profile-form";
import type { Supplier } from "@/types/db";

export default async function SupplierProfilePage() {
  const profile = await requireSupplier();
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle<Supplier>();

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">내 정보</h1>
        <p className="mt-1 text-sm text-zinc-500">사업자 정보 및 정산 계좌를 관리합니다.</p>
      </div>
      <SupplierProfileForm initial={supplier} />
    </div>
  );
}
