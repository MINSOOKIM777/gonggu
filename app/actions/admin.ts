"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export type AdminActionResult =
  | { ok: true; count?: number }
  | { ok: false; error: string };

export async function markSettlementPaid(id: number): Promise<AdminActionResult> {
  await requireAdmin();

  const service = createServiceClient();
  const { error } = await service
    .from("settlements")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/settlements");
  revalidatePath("/admin");
  return { ok: true };
}

export async function markAllPendingSettlementsPaid(): Promise<AdminActionResult> {
  await requireAdmin();

  const service = createServiceClient();
  const { data, error } = await service
    .from("settlements")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("status", "pending")
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/settlements");
  revalidatePath("/admin");
  return { ok: true, count: data?.length ?? 0 };
}
