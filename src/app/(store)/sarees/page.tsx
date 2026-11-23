import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogueView } from "@/components/product/CatalogueView";
import { getCategories, getProducts } from "@/lib/data/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sarees",
  description: "Curated Indian sarees from Poojavi The Label — timeless pieces to be worn, cherished and passed on.",
  alternates: { canonical: "/sarees" },
};

export default async function SareesPage() {
  const [categories, products] = await Promise.all([getCategories("sarees"), getProducts({ department: "sarees" })]);
  return (
    <>
      <PageHeader
        eyebrow="The Saree Edit"
        title="Sarees"
        description="Sarees selected for timeless elegance — each one a story waiting to be worn."
        crumbs={[{ label: "Sarees" }]}
      />
      <CatalogueView products={products} categories={categories} allHref="/sarees" allLabel="All sarees" />
    </>
  );
}
