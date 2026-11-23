import Link from "next/link";
import { StoreImage } from "@/components/ui/StoreImage";
import type { ProductWithRelations } from "@/lib/types";
import { truncate } from "@/lib/utils";

/** Editorial product card. Prices are intentionally never shown. */
export function ProductCard({ product, priority = false }: { product: ProductWithRelations; priority?: boolean }) {
  const [primary, secondary] = product.images;
  const href = `/products/${product.slug}`;
  const label = product.is_new_arrival ? "New Arrival" : product.is_featured ? "Featured" : null;

  return (
    <article className="group flex flex-col">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden" aria-label={product.name} tabIndex={-1}>
        <StoreImage
          path={primary?.storage_path}
          alt={primary?.alt_text || product.name}
          fallbackSeed={product.slug}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          imgClassName="img-zoom"
          preload={priority}
        />
        {secondary && (
          <StoreImage
            path={secondary.storage_path}
            alt=""
            fallbackSeed={`${product.slug}-2`}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}
        {label && (
          <span className="absolute top-3 left-3 bg-ivory/90 px-2.5 py-1 text-[0.58rem] font-medium tracking-[0.22em] text-burgundy uppercase">
            {label}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-4 sm:pt-5">
        {product.category && <p className="eyebrow mb-1.5 !text-[0.6rem]">{product.category.name}</p>}
        <h3 className="font-serif text-lg leading-snug sm:text-xl">
          <Link href={href} className="transition-colors hover:text-burgundy">
            {product.name}
          </Link>
        </h3>
        {product.short_description && (
          <p className="mt-1.5 hidden text-sm leading-relaxed text-charcoal/65 sm:block">{truncate(product.short_description, 110)}</p>
        )}
        <div className="mt-auto pt-3">
          <Link href={href} className="link-underline text-charcoal/90 hover:text-burgundy" aria-label={`View details of ${product.name}`}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
