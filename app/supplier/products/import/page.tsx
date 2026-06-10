"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSheetData, bulkImportProducts } from "@/app/actions/import-products";
import type { ImportRow } from "@/app/actions/import-products";
import { formatKRW } from "@/lib/format";

export default function ImportProductsPage() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<ImportRow[] | null>(null);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());

  async function handleFetch() {
    setError(null);
    setRows(null);
    setLoading(true);
    try {
      const result = await fetchSheetData(url);
      if (!result.ok) { setError(result.error); return; }
      setRows(result.rows);
      setSelected(new Set(result.rows.map((_, i) => i)));
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!rows) return;
    setImporting(true);
    setError(null);
    try {
      const toImport = rows.filter((_, i) => selected.has(i));
      const result = await bulkImportProducts(toImport);
      if (!result.ok) { setError(result.error); return; }
      alert(`${result.count}개 상품이 등록되었습니다.`);
      router.push("/supplier/products");
    } finally {
      setImporting(false);
    }
  }

  function toggleAll() {
    if (!rows) return;
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((_, i) => i)));
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/supplier/products" className="text-sm text-zinc-500 hover:underline">← 상품 관리로</Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">구글 시트 일괄 등록</h1>
        <p className="mt-1 text-sm text-zinc-500">구글 시트 URL을 입력하면 상품을 한 번에 등록합니다.</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">사전 준비: 시트 공개 설정</p>
        <p>구글 시트 → 우측 상단 <strong>공유</strong> → <strong>링크가 있는 모든 사용자</strong> → <strong>뷰어</strong>로 변경 후 URL을 붙여넣으세요.</p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="sheet-url">구글 시트 URL</Label>
        <div className="flex gap-2">
          <Input
            id="sheet-url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleFetch} disabled={loading || !url.trim()}>
            {loading ? "불러오는 중..." : "불러오기"}
          </Button>
        </div>
        <p className="text-xs text-zinc-400">
          컬럼 순서: 이미지 / 종류 / 크기 / 등급 / 중량 / 과수 / 가격 / 상세 설명
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-700">
              총 <span className="text-[var(--brand)]">{rows.length}개</span> 상품 발견 —{" "}
              <span className="text-zinc-500">{selected.size}개 선택됨</span>
            </p>
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selected.size === rows.length ? "전체 해제" : "전체 선택"}
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-3 py-3 w-10" />
                  <th className="px-3 py-3 font-medium">상품명</th>
                  <th className="px-3 py-3 font-medium text-right">가격</th>
                  <th className="px-3 py-3 font-medium max-w-xs">설명</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-zinc-100 last:border-0 cursor-pointer ${selected.has(i) ? "" : "opacity-40"}`}
                    onClick={() => {
                      const next = new Set(selected);
                      if (next.has(i)) next.delete(i); else next.add(i);
                      setSelected(next);
                    }}
                  >
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" readOnly checked={selected.has(i)} className="accent-[var(--brand)]" />
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-900">{row.name}</td>
                    <td className="px-3 py-2 text-right text-zinc-700">{formatKRW(row.price)}</td>
                    <td className="px-3 py-2 text-zinc-500 max-w-xs truncate">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/supplier/products">
              <Button variant="outline">취소</Button>
            </Link>
            <Button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
            >
              {importing ? "등록 중..." : `${selected.size}개 상품 등록하기`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
