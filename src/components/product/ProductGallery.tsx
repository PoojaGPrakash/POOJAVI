"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TextileArt } from "@/components/brand/TextileArt";
import { publicImageUrl } from "@/lib/storage";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, productName, seed }: { images: ProductImage[]; productName: string; seed: string }) {
  const [index, setIndex] = useState(0);
  const items = images
    .map((img) => ({ ...img, url: publicImageUrl(img.storage_path) }))
    .filter((img): img is ProductImage & { url: string } => Boolean(img.url));

  if (!items.length) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden bg-beige">
        <TextileArt seed={seed} />
        <p className="absolute inset-x-0 bottom-6 text-center text-[0.62rem] tracking-[0.24em] text-ivory uppercase mix-blend-difference">
          Photographs available on request
        </p>
      </div>
    );
  }

  const current = items[Math.min(index, items.length - 1)] ?? items[0]!;
  const go = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length);

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-4">
      {items.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto md:w-20 md:flex-col md:overflow-visible" aria-label="Product images">
          {items.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${items.length}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative block aspect-[4/5] w-16 overflow-hidden border transition md:w-20",
                  i === index ? "border-burgundy" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-beige">
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt_text || `${productName} — image ${index + 1}`}
          fill
          preload={index === 0}
          loading="eager"
          quality={85}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="animate-fade-in object-cover"
        />
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-ivory/85 transition hover:bg-ivory"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-ivory/85 transition hover:bg-ivory"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <p className="absolute right-3 bottom-3 bg-ivory/85 px-2 py-1 text-[0.62rem] tracking-[0.2em]" aria-live="polite">
              {index + 1} / {items.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
