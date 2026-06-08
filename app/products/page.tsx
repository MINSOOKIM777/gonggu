import { createClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/product-grid";
import { CategoryFilter } from "@/components/category-filter";
import { SortSelect } from "@/components/sort-select";
import { PriceRangeFilter } from "@/components/price-range-filter";
import type { Category, Product } from "@/types/db";

type SortKey = "latest" | "price_asc" | "price_desc" | "popular";

const VALID_SORTS: SortKey[] = ["latest", "price_asc", "price_desc", "popular"];

function parsePrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    min_price?: string;
    max_price?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const categorySlug = sp.category?.trim() || undefined;
  const sortRaw = sp.sort?.trim();
  const sort: SortKey = VALID_SORTS.includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : "latest";
  const minPrice = parsePrice(sp.min_price);
  const maxPrice = parsePrice(sp.max_price);

  const supabase = await createClient();

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("*")
    .order("id", { ascending: true });
  const categories = (categoryRows ?? []) as Category[];

  let resolvedCategory: Category | undefined;
  if (categorySlug) {
    resolvedCategory = categories.find((c) => c.slug === categorySlug);
  }

  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .limit(60);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (resolvedCategory) {
    query = query.eq("category_id", resolvedCategory.id);
  }
  if (minPrice !== undefined) {
    query = query.gte("price", minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte("price", maxPrice);
  }

  if (sort === "price_asc") {
    query = query
      .order("price", { ascending: true })
      .order("created_at", { ascending: false });
  } else if (sort === "price_desc") {
    query = query
      .order("price", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    // popular는 MVP에서 created_at desc로 폴백 (latest와 동일)
    query = query.order("created_at", { ascending: false });
  }

  const { data: products } = await query;

  const title = q
    ? `검색: ${q}`
    : resolvedCategory
      ? resolvedCategory.name
      : "상품 전체";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-zinc-900 mb-4">{title}</h1>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <CategoryFilter
            categories={categories}
            currentSlug={resolvedCategory?.slug}
          />
        </div>
        <div className="shrink-0">
          <SortSelect current={sort} />
        </div>
      </div>

      <div className="mb-6">
        <PriceRangeFilter
          initialMin={sp.min_price}
          initialMax={sp.max_price}
        />
      </div>

      <ProductGrid products={(products ?? []) as Product[]} />
    </div>
  );
}
