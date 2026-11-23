import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StoreImage } from "@/components/ui/StoreImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { getCategories, getCollections } from "@/lib/data/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore curated collections and weaves from Poojavi The Label — Banarasi, Pochampally, raw silk, pure silk, handloom and more.",
  alternates: { canonical: "/collections" },
};

type Tile = { id: string; name: string; href: string; image: string | null; description: string | null };

export default async function CollectionsPage() {
  const [collections, categories] = await Promise.all([getCollections(), getCategories()]);
  const curated: Tile[] = collections.map((c) => ({ id: c.id, name: c.name, href: `/collections/${c.slug}`, image: c.banner_path, description: c.description }));
  const weaves: Tile[] = categories.map((c) => ({ id: c.id, name: c.name, href: `/category/${c.slug}`, image: c.image_path, description: c.description }));

  return (
    <>
      <PageHeader eyebrow="The Edit" title="Collections" description="Curated stories in silk and thread — explore by collection or by weave." crumbs={[{ label: "Collections" }]} />
      <div className="container-luxe space-y-24 pb-24">
        {curated.length > 0 && <TileGrid heading="Curated Collections" tiles={curated} />}
        {weaves.length > 0 && <TileGrid heading="Shop by Weave" tiles={weaves} />}
        {!curated.length && !weaves.length && <EmptyState title="Collections coming soon" description="Our first collections are being curated." />}
      </div>
    </>
  );
}

function TileGrid({ heading, tiles }: { heading: string; tiles: Tile[] }) {
  return (
    <section>
      <h2 className="heading-3 mb-8 text-center sm:mb-10">{heading}</h2>
      <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t, i) => (
          <li key={t.id}>
            <Reveal delay={(i % 3) * 80}>
              <Link href={t.href} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <StoreImage path={t.image} alt={t.name} fallbackSeed={t.id} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" imgClassName="img-zoom" />
                </div>
                <h3 className="mt-5 font-serif text-2xl transition-colors group-hover:text-burgundy">{t.name}</h3>
                {t.description && <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{t.description}</p>}
                <span className="link-underline mt-4">Discover</span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
