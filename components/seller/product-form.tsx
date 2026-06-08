"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/seller/image-upload";
import { ImageGalleryUpload } from "@/components/seller/image-gallery-upload";
import { DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import type { Product, Category } from "@/types/db";
import type { ProductActionResult } from "@/app/actions/seller-products";

type Props = {
  action: (formData: FormData) => Promise<ProductActionResult>;
  categories: Category[];
  sellerId: string;
  initial?: Product;
  submitLabel?: string;
};

export function ProductForm({
  action,
  categories,
  sellerId,
  initial,
  submitLabel = "저장",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(
    initial?.image_url ?? null,
  );
  const [imageUrls, setImageUrls] = useState<string[]>(
    initial?.image_urls ?? [],
  );
  const formRef = useRef<HTMLFormElement>(null);

  const initialCommissionPercent = initial
    ? Number(initial.commission_rate) * 100
    : DEFAULT_COMMISSION_RATE * 100;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    // 이미지 state를 form payload에 주입
    formData.set("image_url", imageUrl ?? "");
    formData.set("image_urls", JSON.stringify(imageUrls));
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result && !result.ok) {
          setError(result.error);
        }
      } catch (err) {
        // redirect()는 NEXT_REDIRECT 에러를 throw — 그대로 흘려보냄
        if (
          err instanceof Error &&
          (err.message === "NEXT_REDIRECT" ||
            (err as { digest?: string }).digest?.toString().startsWith("NEXT_REDIRECT"))
        ) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">상품명</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder="상품명을 입력하세요"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">카테고리</Label>
        <Select
          id="category_id"
          name="category_id"
          defaultValue={initial?.category_id?.toString() ?? ""}
        >
          <option value="">카테고리 선택 안 함</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id.toString()}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">판매가 (원)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={initial?.price ?? ""}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="compare_at_price">정가 (원, 선택)</Label>
          <Input
            id="compare_at_price"
            name="compare_at_price"
            type="number"
            min={0}
            step={1}
            defaultValue={initial?.compare_at_price ?? ""}
            placeholder="할인 표시할 때만 입력"
          />
          <p className="text-xs text-zinc-500">
            판매가보다 크면 할인율이 자동 표시됩니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stock">재고</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={initial?.stock ?? 0}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">상태</Label>
          <Select
            id="status"
            name="status"
            defaultValue={initial?.status ?? "active"}
          >
            <option value="active">판매중</option>
            <option value="inactive">미판매</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>대표 이미지</Label>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          sellerId={sellerId}
        />
      </div>

      <div className="space-y-2">
        <Label>추가 이미지 (선택, 최대 5장)</Label>
        <ImageGalleryUpload
          values={imageUrls}
          onChange={setImageUrls}
          sellerId={sellerId}
          max={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="상품 설명을 입력하세요"
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="commission_rate">수수료율 (%)</Label>
        <Input
          id="commission_rate"
          name="commission_rate"
          type="number"
          min={0}
          max={99.99}
          step={0.01}
          defaultValue={initialCommissionPercent}
          className="sm:max-w-xs"
        />
        <p className="text-xs text-zinc-500">
          기본값 {DEFAULT_COMMISSION_RATE * 100}%
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
