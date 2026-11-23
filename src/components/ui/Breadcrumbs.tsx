import Link from "next/link";
import { env } from "@/lib/env";

export type Crumb = { label: string; href?: string };

/** Visible breadcrumbs + BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${env.siteUrl}${c.href}` } : {}),
    })),
  };
  return (
    <nav aria-label="Breadcrumb" className="text-[0.68rem] uppercase tracking-[0.18em] text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {all.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="text-champagne-dark">/</span>}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="transition-colors hover:text-burgundy">
                {c.label}
              </Link>
            ) : (
              <span aria-current={i === all.length - 1 ? "page" : undefined} className="text-charcoal">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </nav>
  );
}
