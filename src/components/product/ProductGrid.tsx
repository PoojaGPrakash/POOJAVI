import { ProductCard } from "./ProductCard";
import type { ProductWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGrid({ products, columns = 4, className }: { products: ProductWithRelations[]; columns?: 3 | 4; className?: string }) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-14 md:grid-cols-3",
        columns === 4 && "xl:grid-cols-4",
        className,
      )}
    >
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 2} />
        </li>
      ))}
    </ul>
  );
}
