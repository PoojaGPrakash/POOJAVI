import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogueView } from "@/components/product/CatalogueView";
import { getCategories, getProducts } from "@/lib/data/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Fabrics",
  description: "Premium Indian fabrics — raw silk, Banarasi, Pochampally, pure silk, handloom and designer fabrics, curated by Poojavi The Label.",
  alternates: { canonical: "/fabrics" },
};

export default async function FabricsPage() {
  const [categories, products] = await Promise.all([getCategories("fabrics"), getProducts({ department: "fabrics" })]);
  return (
    <>
      <PageHeader
        eyebrow="The Fabric Edit"
        title="Fabrics"
        description="A considered selection of Indian silks, brocades and handloom weaves — chosen for their character, colour and drape."
        crumbs={[{ label: "Fabrics" }]}
      />
      <CatalogueView products={products} categories={categories} allHref="/fabrics" allLabel="All fabrics" />
    </>
  );
}
