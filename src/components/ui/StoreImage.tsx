import Image from "next/image";
import { TextileArt } from "@/components/brand/TextileArt";
import { publicImageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Props = {
  path: string | null | undefined;
  alt: string;
  /** Seed for the decorative pattern shown when no image exists. */
  fallbackSeed: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  preload?: boolean;
  quality?: 75 | 85;
};

/**
 * Fills its (relatively positioned) parent with an optimised Supabase image,
 * or a woven-pattern artwork if none has been uploaded.
 */
export function StoreImage({ path, alt, fallbackSeed, sizes, className, imgClassName, preload = false, quality = 75 }: Props) {
  const src = publicImageUrl(path);
  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-beige", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          preload={preload}
          loading={preload ? "eager" : "lazy"}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <div className={cn("h-full w-full", imgClassName)}>
          <TextileArt seed={fallbackSeed} />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}
