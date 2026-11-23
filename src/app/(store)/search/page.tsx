import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { searchProducts } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function SearchPage({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 80) ?? "";
  const results = q.length >= 2 ? await searchProducts(q) : [];

  return (
    <>
      <PageHeader eyebrow="Search" title={q ? `“${q}”` : "Search"} crumbs={[{ label: "Search" }]} />
      <div className="container-luxe pb-24">
        <form action="/search" role="search" className="mx-auto mb-14 flex max-w-xl gap-2">
          <label htmlFor="search-page-q" className="sr-only">
            Search
          </label>
          <input id="search-page-q" name="q" type="search" defaultValue={q} minLength={2} maxLength={80} required placeholder="Name, weave, colour or reference" className="field-input" />
          <button type="submit" className="btn-primary shrink-0">
            Search
          </button>
        </form>
        {q.length < 2 ? (
          <EmptyState title="What are you looking for?" description="Search by product name, weave, colour or reference number." />
        ) : results.length ? (
          <>
            <p className="mb-8 text-[0.66rem] tracking-[0.22em] text-muted uppercase" aria-live="polite">
              {results.length} {results.length === 1 ? "result" : "results"}
            </p>
            <ProductGrid products={results} />
          </>
        ) : (
          <EmptyState title="No pieces found" description="Try a different word, or ask us on WhatsApp — we may have exactly what you are looking for." actionHref="/collections" actionLabel="Browse collections" />
        )}
      </div>
    </>
  );
}
