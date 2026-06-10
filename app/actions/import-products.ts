"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_COMMISSION_RATE } from "@/lib/constants";

export type ImportRow = {
  name: string;
  size: string;
  weight: string;
  price: number;
  description: string;
  image_url: string;
};

export type FetchSheetResult =
  | { ok: true; rows: ImportRow[] }
  | { ok: false; error: string };

export type BulkImportResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

function extractSheetId(url: string): { id: string; gid?: string } | null {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return null;
  const gidMatch = url.match(/[?&#]gid=(\d+)/);
  return { id: idMatch[1], gid: gidMatch?.[1] };
}

function parsePrice(raw: string): number {
  return parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { row.push(cell.trim()); cell = ""; }
      else if (ch === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ""; }
      else if (ch === '\r') { /* skip */ }
      else { cell += ch; }
    }
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows;
}

export async function fetchSheetData(url: string): Promise<FetchSheetResult> {
  const parsed = extractSheetId(url);
  if (!parsed) return { ok: false, error: "올바른 Google Sheets URL이 아닙니다." };

  const csvUrl = `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv${parsed.gid ? `&gid=${parsed.gid}` : ""}`;

  let text: string;
  try {
    const res = await fetch(csvUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: "시트가 비공개 상태입니다. 공유 설정에서 '링크가 있는 모든 사용자 → 뷰어'로 변경해 주세요." };
      }
      return { ok: false, error: `시트를 불러오지 못했습니다. (${res.status})` };
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      return { ok: false, error: "시트가 비공개 상태입니다. 공유 설정에서 '링크가 있는 모든 사용자 → 뷰어'로 변경해 주세요." };
    }
    text = await res.text();
  } catch {
    return { ok: false, error: "시트를 불러오는 중 오류가 발생했습니다." };
  }

  const allRows = parseCsv(text);
  // 첫 행(헤더) 건너뜀, 빈 행 제거
  const dataRows = allRows.slice(1).filter((r) => r.some((c) => c.length > 0));

  // 열 인덱스: 이미지(0), 종류(1), 크기(2), 등급(3), 중량(4), 과수(5), 가격(6), 설명(7)
  let lastName = "";
  let lastDesc = "";
  let lastImageUrl = "";

  const rows: ImportRow[] = [];

  for (const r of dataRows) {
    const nameRaw = r[1] ?? "";
    const size = r[2] ?? "";
    const weight = r[4] ?? "";
    const priceRaw = r[6] ?? "";
    const descRaw = r[7] ?? "";

    // forward-fill: 병합된 셀은 CSV에서 빈 값으로 나옴
    if (nameRaw) lastName = nameRaw;
    if (descRaw) lastDesc = descRaw;

    const name = lastName;
    const price = parsePrice(priceRaw);

    if (!name || price === 0) continue;

    // 상품명 조합: 종류 + 크기(있으면) + 중량
    const parts = [name];
    if (size && size !== "-") parts.push(size);
    if (weight && weight !== "-") parts.push(weight);
    const fullName = parts.join(" ");

    rows.push({
      name: fullName,
      size,
      weight,
      price,
      description: lastDesc,
      image_url: lastImageUrl,
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: "등록 가능한 상품 데이터를 찾지 못했습니다. 시트 형식을 확인해 주세요." };
  }

  return { ok: true, rows };
}

export async function bulkImportProducts(
  rows: { name: string; price: number; description: string; image_url: string }[],
): Promise<BulkImportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const admin = createServiceClient();
  const { error } = await admin.from("products").insert(
    rows.map((r) => ({
      supplier_id: user.id,
      name: r.name,
      description: r.description || null,
      price: r.price,
      stock: 0,
      image_url: r.image_url || null,
      commission_rate: DEFAULT_COMMISSION_RATE,
    })),
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true, count: rows.length };
}
