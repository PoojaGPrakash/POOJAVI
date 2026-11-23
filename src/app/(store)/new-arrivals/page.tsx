import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogueView } from "@/components/product/CatalogueView";
import { getProducts } from "@/lib/data/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The latest fabrics and sarees to arrive at Poojavi The Label.",
  alternates: { canonical: "/new-arrivals" },
};

export default async function NewArrivalsPage() {
  const products = await getProducts({ newArrival: true });
  return (
    <>
      <PageHeader eyebrow="Just in" title="New Arrivals" description="The newest additions to our edit of fabrics and sarees." crumbs={[{ label: "New Arrivals" }]} />
      <CatalogueView products={products} emptyTitle="New arrivals are on their way" />
    </>
  );
}
