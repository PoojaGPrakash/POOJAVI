import Link from "next/link";
import { StoreImage } from "@/components/ui/StoreImage";
import { Reveal } from "@/components/ui/Reveal";
import { toParagraphs } from "@/lib/utils";

export function StorySection({ heading, body, imagePath }: { heading: string | null; body: string | null; imagePath: string | null }) {
  const paragraphs = toParagraphs(body).slice(0, 2);
  if (!heading && !paragraphs.length) return null;
  return (
    <section className="py-20 sm:py-28">
      <div className="container-luxe grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative aspect-[4/5] w-full">
          <StoreImage path={imagePath} alt={heading ?? "Our story"} fallbackSeed="our-story" sizes="(min-width: 1024px) 50vw, 100vw" />
          <div className="pointer-events-none absolute -right-3 -bottom-3 hidden h-full w-full border border-champagne sm:block" aria-hidden="true" />
        </Reveal>
        <Reveal delay={120} className="lg:max-w-xl">
          <p className="eyebrow mb-5">Our Story</p>
          {heading && <h2 className="display-2">{heading}</h2>}
          <span className="rule my-8 block" aria-hidden="true" />
          <div className="space-y-5">
            {paragraphs.map((p, i) => (
              <p key={i} className="body-lg">
                {p}
              </p>
            ))}
          </div>
          <Link href="/our-story" className="btn-outline mt-10">
            Read our story
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
