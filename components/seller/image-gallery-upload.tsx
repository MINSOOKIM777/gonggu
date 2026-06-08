"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 5 * 1024 * 1024;

function genId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sanitizeFileName(name: string): string {
  const base = name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.length > 60 ? base.slice(-60) : base;
}

export function ImageGalleryUpload({
  values,
  onChange,
  sellerId,
  max = 5,
}: {
  values: string[];
  onChange: (urls: string[]) => void;
  sellerId: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    const remaining = max - values.length;
    if (remaining <= 0) {
      setError(`이미지는 최대 ${max}장까지 업로드할 수 있습니다.`);
      return;
    }

    const list = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const supabase = createClient();
      const uploaded: string[] = [];
      for (const file of list) {
        if (!file.type.startsWith("image/")) {
          setError("이미지 파일만 업로드 가능합니다.");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`"${file.name}"은(는) 5MB를 초과합니다.`);
          continue;
        }
        const path = `${sellerId}/${genId()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (uploadError) {
          setError(uploadError.message);
          continue;
        }
        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length > 0) {
        onChange([...values, ...uploaded]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    const next = values.slice();
    next.splice(index, 1);
    onChange(next);
  }

  const canAdd = values.length < max;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
      />

      <div className="flex flex-wrap gap-3">
        {values.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="relative h-24 w-24 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
          >
            <Image
              src={url}
              alt={`추가 이미지 ${idx + 1}`}
              fill
              sizes="96px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white hover:bg-black/80"
              aria-label="이미지 삭제"
            >
              ×
            </button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <span>업로드 중...</span>
            ) : (
              <>
                <span className="text-lg leading-none">+</span>
                <span className="mt-1">
                  추가 ({values.length}/{max})
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {!canAdd && (
        <p className="text-xs text-zinc-500">
          최대 {max}장까지 업로드 가능합니다.
        </p>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
          {error}
        </p>
      )}

      <div className="mt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !canAdd}
        >
          {uploading ? "업로드 중..." : "이미지 추가"}
        </Button>
      </div>
    </div>
  );
}
