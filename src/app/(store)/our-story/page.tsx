import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StoreImage } from "@/components/ui/StoreImage";
import { Prose } from "@/components/ui/Prose";
import { Monogram } from "@/components/brand/Monogram";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteSettings } from "@/lib/data/public";
import { brand } from "@/lib/brand";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Story",
  description: "The story of Poojavi The Label — a label celebrating Indian textiles, craftsmanship, timeless elegance and meaningful fashion.",
  alternates: { canonical: "/our-story" },
};

const values = [
  { title: "Indian Textiles", text: "We celebrate the extraordinary breadth of India's weaving traditions and the fabrics they create." },
  { title: "Craftsmanship", text: "We value the skill, patience and artistry that go into every length of handwoven cloth." },
  { title: "Timeless Elegance", text: "We choose pieces that transcend seasons — made to be worn for years, not moments." },
  { title: "Meaningful Fashion", text: "We believe clothing can carry memory and meaning. Every piece is a story you choose to wear." },
];

export default async function OurStoryPage() {
  const s = await getSiteSettings();
  return (
    <>
      <PageHeader eyebrow={brand.fullName} title={s.story_heading || brand.tagline} crumbs={[{ label: "Our Story" }]} />

      <section className="container-luxe grid items-start gap-12 pb-24 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal className="relative aspect-[4/5]">
          <StoreImage path={s.story_image_path} alt={`${brand.fullName} — our story`} fallbackSeed="our-story" sizes="(min-width: 1024px) 45vw, 100vw" preload />
        </Reveal>
        <div className="lg:pt-6">
          <Prose text={s.story_body} className="[&>p:first-child]:font-serif [&>p:first-child]:text-2xl [&>p:first-child]:leading-relaxed [&>p:first-child]:text-charcoal" />
        </div>
      </section>

      <section className="bg-burgundy py-20 text-ivory sm:py-28">
        <div className="container-luxe">
          <div className="mb-14 flex flex-col items-center text-center">
            <Monogram className="mb-6 h-12 w-12 text-champagne" />
            <h2 className="display-2 text-ivory">What we stand for</h2>
          </div>
          <dl className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 80} className="border-t border-ivory/25 pt-6">
                <dt className="font-serif text-2xl text-champagne">{v.title}</dt>
                <dd className="mt-3 text-sm leading-relaxed text-ivory/75">{v.text}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {(s.craft_heading || s.craft_body) && (
        <section className="container-luxe grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 lg:order-1">
            <p className="eyebrow mb-5">Craftsmanship & Heritage</p>
            {s.craft_heading && <h2 className="display-2 mb-8">{s.craft_heading}</h2>}
            <Prose text={s.craft_body} />
            <Link href="/collections" className="btn-outline mt-10">
              Explore the collections
            </Link>
          </div>
          <Reveal className="relative order-1 aspect-[4/5] lg:order-2">
            <StoreImage path={s.craft_image_path} alt="Craftsmanship and heritage" fallbackSeed="craft-heritage" sizes="(min-width: 1024px) 50vw, 100vw" />
          </Reveal>
        </section>
      )}
    </>
  );
}
