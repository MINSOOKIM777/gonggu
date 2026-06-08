"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_COMMISSION_RATE } from "@/lib/constants";

export type ProductActionResult =
  | { ok: true }
  | { ok: false; error: string };

type ParsedValues = {
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  image_url: string | null;
  image_urls: string[];
  category_id: number | null;
  commission_rate: number;
  status: "active" | "inactive";
};

function parseImageUrls(raw: string): string[] | null {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  } catch {
    return null;
  }
}

function parseFormValues(formData: FormData): { error: string } | { values: ParsedValues } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const compareAtRaw = String(formData.get("compare_at_price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const imageUrlsRaw = String(formData.get("image_urls") ?? "").trim();
  const categoryIdRaw = String(formData.get("category_id") ?? "").trim();
  const commissionRaw = String(formData.get("commission_rate") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (!name) return { error: "상품명을 입력해 주세요." };

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "가격을 올바르게 입력해 주세요." };
  }

  let compare_at_price: number | null = null;
  if (compareAtRaw !== "") {
    const v = Number(compareAtRaw);
    if (!Number.isFinite(v) || v < 0) {
      return { error: "정가를 올바르게 입력해 주세요." };
    }
    compare_at_price = Math.round(v);
    if (compare_at_price <= Math.round(price)) {
      compare_at_price = null;
    }
  }

  const stock = Number(stockRaw);
  if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
    return { error: "재고를 올바르게 입력해 주세요." };
  }

  const commissionPercent =
    commissionRaw === ""
      ? DEFAULT_COMMISSION_RATE * 100
      : Number(commissionRaw);
  if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent >= 100) {
    return { error: "수수료율을 올바르게 입력해 주세요. (0–99)" };
  }
  const commission_rate = commissionPercent / 100;

  const parsedImageUrls = parseImageUrls(imageUrlsRaw);
  if (parsedImageUrls === null) {
    return { error: "이미지 URL 목록이 올바르지 않습니다." };
  }

  const category_id =
    categoryIdRaw !== "" && !Number.isNaN(Number(categoryIdRaw))
      ? Number(categoryIdRaw)
      : null;

  return {
    values: {
      name,
      description: description || null,
      price: Math.round(price),
      compare_at_price,
      stock,
      image_url: imageUrl || null,
      image_urls: parsedImageUrls,
      category_id,
      commission_rate,
      status: status as "active" | "inactive",
    },
  };
}

export async function createProduct(
  formData: FormData,
): Promise<ProductActionResult> {
  const parsed = parseFormValues(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { error } = await supabase.from("products").insert({
    supplier_id: user.id,
    ...parsed.values,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/supplier/products");
  redirect("/supplier/products");
}

export async function updateProduct(
  id: string,
  formData: FormData,
): Promise<ProductActionResult> {
  const parsed = parseFormValues(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("products")
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("supplier_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/supplier/products");
  revalidatePath(`/supplier/products/${id}/edit`);
  redirect("/supplier/products");
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("supplier_id", user.id);

  revalidatePath("/supplier/products");
  redirect("/supplier/products");
}
