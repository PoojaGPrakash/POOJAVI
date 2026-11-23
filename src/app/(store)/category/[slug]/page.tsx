import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogueView } from "@/components/product/CatalogueView";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/data/public";
import { publicImageUrl } from "@/lib/storage";

export const revalidate = 300;

// Pages are generated on first request and cached (ISR); see revalidateStorefront().
export function generateStaticParams(): { slug: string }[] {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Not found" };
  const image = publicImageUrl(category.image_path);
  return {
    title: category.name,
    description: category.description ?? `${category.name} by Poojavi The Label.`,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: { title: category.name, description: category.description ?? undefined, ...(image ? { images: [image] } : {}) },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const [siblings, products] = await Promise.all([getCategories(category.department), getProducts({ categoryId: category.id })]);
  const parent = category.department === "sarees" ? { label: "Sarees", href: "/sarees" } : { label: "Fabrics", href: "/fabrics" };

  return (
    <>
      <PageHeader
        eyebrow={parent.label}
        title={category.name}
        description={category.description}
        crumbs={[parent, { label: category.name }]}
        imagePath={category.image_path}
        seed={category.slug}
      />
      <CatalogueView products={products} categories={siblings} activeSlug={category.slug} allHref={parent.href} allLabel={`All ${parent.label.toLowerCase()}`} />
    </>
  );
}
