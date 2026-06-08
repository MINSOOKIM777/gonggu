"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[activeIndex] : null;

  if (!hasImages) {
    return (
      <div className="relative aspect-square w-full bg-zinc-100 rounded-lg overflow-hidden" />
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative aspect-square w-full bg-zinc-100 rounded-lg overflow-hidden">
        <Image
          src={currentImage!}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 480px, 100vw"
          className="object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col gap-2 w-16 shrink-0">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={cn(
              "relative w-16 h-16 rounded-md overflow-hidden bg-zinc-100 border-2 transition-colors",
              idx === activeIndex
                ? "border-[var(--brand)]"
                : "border-transparent hover:border-zinc-300",
            )}
            aria-label={`이미지 ${idx + 1}`}
          >
            <Image
              src={img}
              alt={`${alt} ${idx + 1}`}
              fill
              sizes="64px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <div className="relative flex-1 aspect-square bg-zinc-100 rounded-lg overflow-hidden">
        <Image
          src={currentImage!}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 400px, 100vw"
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
