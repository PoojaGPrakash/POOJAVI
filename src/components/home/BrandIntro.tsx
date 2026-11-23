import { Monogram } from "@/components/brand/Monogram";
import { Reveal } from "@/components/ui/Reveal";

export function BrandIntro({ eyebrow, heading, body }: { eyebrow: string | null; heading: string | null; body: string | null }) {
  if (!heading && !body) return null;
  return (
    <section className="container-luxe py-20 sm:py-28 lg:py-32">
      <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <Monogram className="mb-8 h-11 w-11 text-champagne-dark" />
        {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
        {heading && <h2 className="display-2">{heading}</h2>}
        <span className="rule my-8" aria-hidden="true" />
        {body && <p className="font-serif text-xl leading-[1.7] text-charcoal/80 sm:text-[1.6rem] sm:leading-[1.6]">{body}</p>}
      </Reveal>
    </section>
  );
}
