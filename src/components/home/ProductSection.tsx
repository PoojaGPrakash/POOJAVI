import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import type { ProductWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductSection({
  eyebrow,
  title,
  description,
  products,
  href,
  hrefLabel = "View all",
  tinted = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  products: ProductWithRelations[];
  href: string;
  hrefLabel?: string;
  tinted?: boolean;
}) {
  if (!products.length) return null;
  return (
    <section className={cn("py-20 sm:py-28", tinted && "bg-white/60")}>
      <div className="container-luxe">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          align="left"
          action={
            <Link href={href} className="link-underline hover:text-burgundy">
              {hrefLabel}
            </Link>
          }
        />
        <Reveal>
          <ProductGrid products={products} />
        </Reveal>
      </div>
    </section>
  );
}
