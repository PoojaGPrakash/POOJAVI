import { StoreImage } from "@/components/ui/StoreImage";
import { Reveal } from "@/components/ui/Reveal";
import { toParagraphs } from "@/lib/utils";

const pillars = [
  { title: "The Weave", text: "Chosen for the integrity and finish of its weave." },
  { title: "The Colour", text: "Selected for depth, richness and how it lives in light." },
  { title: "The Drape", text: "Handled and assessed for fall, feel and movement." },
];

export function CraftSection({ heading, body, imagePath }: { heading: string | null; body: string | null; imagePath: string | null }) {
  const paragraphs = toParagraphs(body);
  if (!heading && !paragraphs.length) return null;
  return (
    <section className="relative overflow-hidden bg-burgundy text-ivory">
      <div className="grid lg:grid-cols-2">
        <div className="relative order-2 min-h-[360px] lg:order-1 lg:min-h-[640px]">
          <StoreImage path={imagePath} alt={heading ?? "Craftsmanship"} fallbackSeed="craft-heritage" sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
        <div className="order-1 flex items-center px-5 py-20 sm:px-10 lg:order-2 lg:px-20 lg:py-28">
          <Reveal className="max-w-xl">
            <p className="mb-5 text-[0.68rem] font-medium tracking-[0.32em] text-champagne uppercase">Craftsmanship & Heritage</p>
            {heading && <h2 className="display-2 text-ivory">{heading}</h2>}
            <div className="mt-8 space-y-5">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[0.98rem] leading-[1.85] text-ivory/80">
                  {p}
                </p>
              ))}
            </div>
            <dl className="mt-12 grid gap-8 border-t border-ivory/20 pt-10 sm:grid-cols-3">
              {pillars.map((p) => (
                <div key={p.title}>
                  <dt className="font-serif text-xl text-champagne">{p.title}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ivory/70">{p.text}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
