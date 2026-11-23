import Link from "next/link";
import { ProductGrid } from "./ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CategoryRow } from "@/lib/database.types";
import type { ProductWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Category chips + product grid + empty state, shared by listing pages. */
export function CatalogueView({
  products,
  categories = [],
  activeSlug,
  allHref,
  allLabel = "All",
  emptyTitle = "Coming soon",
  emptyDescription = "New pieces are being added to this edit. Message us on WhatsApp for a private preview.",
}: {
  products: ProductWithRelations[];
  categories?: Pick<CategoryRow, "id" | "name" | "slug">[];
  activeSlug?: string;
  allHref?: string;
  allLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return (
    <div className="container-luxe pb-24">
      {categories.length > 1 && (
        <nav aria-label="Filter by category" className="-mx-5 mb-10 overflow-x-auto px-5 sm:mx-0 sm:mb-14 sm:px-0">
          <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap sm:justify-center">
            {allHref && (
              <li>
                <Chip href={allHref} active={!activeSlug}>
                  {allLabel}
                </Chip>
              </li>
            )}
            {categories.map((c) => (
              <li key={c.id}>
                <Chip href={`/category/${c.slug}`} active={c.slug === activeSlug}>
                  {c.name}
                </Chip>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <p className="mb-8 text-[0.66rem] tracking-[0.22em] text-muted uppercase" aria-live="polite">
        {products.length} {products.length === 1 ? "piece" : "pieces"}
      </p>
      {products.length ? <ProductGrid products={products} /> : <EmptyState title={emptyTitle} description={emptyDescription} actionHref="/collections" actionLabel="Explore collections" />}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-10 items-center border px-4 text-[0.64rem] font-medium tracking-[0.2em] whitespace-nowrap uppercase transition-colors",
        active ? "border-burgundy bg-burgundy text-ivory" : "border-line bg-white/50 text-charcoal hover:border-charcoal",
      )}
    >
      {children}
    </Link>
  );
}
