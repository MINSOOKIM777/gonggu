"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function genId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sanitizeFileName(name: string): string {
  // 한글/특수문자 제거 → 영숫자/점/하이픈/언더바만 허용
  const base = name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.length > 60 ? base.slice(-60) : base;
}

export function ImageUpload({
  value,
  onChange,
  sellerId,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  sellerId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${sellerId}/${genId()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function triggerInput() {
    inputRef.current?.click();
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {value ? (
        <div className="flex items-start gap-3">
          <div className="relative h-32 w-32 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
            <Image
              src={value}
              alt="대표 이미지"
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={triggerInput}
              disabled={uploading}
            >
              {uploading ? "업로드 중..." : "변경"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(null)}
              disabled={uploading}
            >
              삭제
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerInput}
          disabled={uploading}
          className="flex h-32 w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <span>업로드 중...</span>
          ) : (
            <>
              <span className="font-medium text-zinc-700">이미지 업로드</span>
              <span className="text-xs">클릭하여 파일 선택 (5MB 이하)</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
