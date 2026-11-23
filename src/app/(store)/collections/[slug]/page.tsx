import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogueView } from "@/components/product/CatalogueView";
import { getCollectionBySlug, getCollectionProducts } from "@/lib/data/public";
import { publicImageUrl } from "@/lib/storage";

export const revalidate = 300;

// Pages are generated on first request and cached (ISR); see revalidateStorefront().
export function generateStaticParams(): { slug: string }[] {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Not found" };
  const image = publicImageUrl(collection.banner_path);
  return {
    title: collection.name,
    description: collection.description ?? `${collection.name} — a curated collection by Poojavi The Label.`,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: { title: collection.name, description: collection.description ?? undefined, ...(image ? { images: [image] } : {}) },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();
  const products = await getCollectionProducts(collection.id);
  return (
    <>
      <PageHeader
        eyebrow="Collection"
        title={collection.name}
        description={collection.description}
        crumbs={[{ label: "Collections", href: "/collections" }, { label: collection.name }]}
        imagePath={collection.banner_path}
        seed={collection.slug}
      />
      <CatalogueView products={products} emptyTitle="This collection is being curated" />
    </>
  );
}
