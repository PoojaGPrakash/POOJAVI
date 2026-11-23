import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Prose } from "@/components/ui/Prose";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { getProductBySlug, getProductCollections, getRelatedProducts } from "@/lib/data/public";
import { publicImageUrl } from "@/lib/storage";
import { productCode, productEnquiryMessage } from "@/lib/whatsapp";
import { env } from "@/lib/env";
import { brand } from "@/lib/brand";

export const revalidate = 300;

// Pages are generated on first request and cached (ISR); see revalidateStorefront().
export function generateStaticParams(): { slug: string }[] {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  const images = product.images.map((i) => publicImageUrl(i.storage_path)).filter((u): u is string => Boolean(u));
  const description = product.short_description || product.description?.slice(0, 160) || `${product.name} by ${brand.fullName}.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description, type: "website", ...(images.length ? { images: images.slice(0, 4) } : {}) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [related, collections] = await Promise.all([getRelatedProducts(product), getProductCollections(product.id)]);

  const category = product.category;
  const parent = category?.department === "sarees" ? { label: "Sarees", href: "/sarees" } : { label: "Fabrics", href: "/fabrics" };
  const code = productCode(product);
  const enquiry = productEnquiryMessage(
    { name: product.name, slug: product.slug, sku: code, category: category?.name, colours: product.colours },
    env.siteUrl,
  );

  const details: { label: string; value: string | null }[] = [
    { label: "Category", value: category?.name ?? null },
    { label: "Collection", value: collections.length ? collections.map((c) => c.name).join(", ") : null },
    { label: "Product code", value: code },
    { label: "Weaving technique", value: product.weaving_technique },
  ];

  // Product structured data — intentionally without price/offers (enquiry-only catalogue).
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description || product.description || undefined,
    sku: product.sku || undefined,
    category: category?.name,
    brand: { "@type": "Brand", name: brand.fullName },
    image: product.images.map((i) => publicImageUrl(i.storage_path)).filter(Boolean),
    url: `${env.siteUrl}/products/${product.slug}`,
    color: product.colours.length ? product.colours.join(", ") : undefined,
  };

  return (
    <>
      <div className="container-luxe pt-8 pb-6 sm:pt-10">
        <Breadcrumbs items={[parent, ...(category ? [{ label: category.name, href: `/category/${category.slug}` }] : []), { label: product.name }]} />
      </div>

      <section className="container-luxe grid gap-10 pb-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 xl:gap-24">
        <ProductGallery images={product.images} productName={product.name} seed={product.slug} />

        <div className="lg:sticky lg:top-[170px] lg:self-start">
          {category && (
            <Link href={`/category/${category.slug}`} className="eyebrow transition-colors hover:text-burgundy">
              {category.name}
            </Link>
          )}
          <h1 className="mt-4 font-serif text-[2.3rem] leading-[1.1] sm:text-5xl">{product.name}</h1>
          {(product.is_new_arrival || product.is_featured) && (
            <p className="mt-4 flex gap-2">
              {product.is_new_arrival && <span className="border border-burgundy/40 px-2.5 py-1 text-[0.58rem] tracking-[0.22em] text-burgundy uppercase">New Arrival</span>}
              {product.is_featured && <span className="border border-champagne-dark/60 px-2.5 py-1 text-[0.58rem] tracking-[0.22em] text-charcoal uppercase">Featured</span>}
            </p>
          )}
          {product.short_description && <p className="mt-6 font-serif text-xl leading-relaxed text-charcoal/80">{product.short_description}</p>}

          {product.colours.length > 0 && (
            <div className="mt-8">
              <h2 className="field-label font-sans">Available colours</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.colours.map((c) => (
                  <li key={c} className="border border-line bg-white/60 px-3 py-1.5 text-sm">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 border-y border-line py-8">
            <WhatsAppButton message={enquiry} className="w-full" label="Enquire on WhatsApp" />
            <p className="text-center text-xs leading-relaxed text-muted">
              Product code <span className="font-medium text-charcoal">{code}</span> is sent automatically. Pricing, availability and
              additional photographs are shared personally on WhatsApp.
            </p>
          </div>

          <dl className="mt-8 divide-y divide-line/70">
            {details
              .filter((d): d is { label: string; value: string } => Boolean(d.value))
              .map((d) => (
                <div key={d.label} className="grid grid-cols-[9rem_1fr] gap-4 py-3.5 text-sm">
                  <dt className="text-[0.66rem] tracking-[0.18em] text-muted uppercase">{d.label}</dt>
                  <dd className="text-charcoal">{d.value}</dd>
                </div>
              ))}
          </dl>

          {product.description && (
            <section className="mt-10">
              <h2 className="heading-3 mb-4">Description</h2>
              <Prose text={product.description} />
            </section>
          )}
          {product.fabric_details && (
            <section className="mt-10">
              <h2 className="heading-3 mb-4">Fabric details</h2>
              <Prose text={product.fabric_details} />
            </section>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line/60 bg-white/50 py-20 sm:py-24">
          <div className="container-luxe">
            <div className="mb-10 text-center sm:mb-14">
              <p className="eyebrow mb-4">You may also love</p>
              <h2 className="display-2">Related pieces</h2>
            </div>
            <ProductGrid products={related} />
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
