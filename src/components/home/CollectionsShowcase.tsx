import Link from "next/link";
import { StoreImage } from "@/components/ui/StoreImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

export type ShowcaseItem = { id: string; name: string; href: string; imagePath: string | null; description: string | null };

/** "Explore Collections" — featured collections, or active categories as a fallback. */
export function CollectionsShowcase({ items }: { items: ShowcaseItem[] }) {
  if (!items.length) return null;
  const [lead, ...rest] = items.slice(0, 5);
  if (!lead) return null;

  return (
    <section className="bg-beige/50 py-20 sm:py-28">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="The Edit"
          title="Explore Collections"
          action={
            <Link href="/collections" className="link-underline hover:text-burgundy">
              View all
            </Link>
          }
          align="left"
        />
        {rest.length === 0 ? (
          <Reveal>
            <Tile item={lead} large wide />
          </Reveal>
        ) : (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Reveal className="h-full">
              <Tile item={lead} large />
            </Reveal>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {rest.map((item, i) => (
                <Reveal key={item.id} delay={i * 80}>
                  <Tile item={item} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Tile({ item, large = false, wide = false }: { item: ShowcaseItem; large?: boolean; wide?: boolean }) {
  const shape = wide ? "aspect-[4/5] sm:aspect-[16/7]" : large ? "aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[560px]" : "aspect-[4/5]";
  return (
    <Link href={item.href} className={`group relative block overflow-hidden ${shape}`}>
      <StoreImage
        path={item.imagePath}
        alt={item.name}
        fallbackSeed={item.id}
        sizes={wide ? "100vw" : large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
        imgClassName="img-zoom"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/65 via-charcoal/5 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-ivory sm:p-7">
        <h3 className={`font-serif text-ivory ${large ? "text-3xl sm:text-4xl" : "text-lg sm:text-2xl"}`}>{item.name}</h3>
        <span className="mt-2 inline-block text-[0.6rem] tracking-[0.26em] uppercase opacity-90 transition-opacity group-hover:opacity-100 sm:mt-3 sm:text-[0.64rem]">
          Discover →
        </span>
      </div>
    </Link>
  );
}
