"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { TextileArt } from "@/components/brand/TextileArt";
import { Monogram } from "@/components/brand/Monogram";
import { publicImageUrl } from "@/lib/storage";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { HomepageBannerRow } from "@/lib/database.types";

const ROTATE_MS = 7000;

export function Hero({ banners }: { banners: HomepageBannerRow[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(count, 1)), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(next, ROTATE_MS);
    return () => window.clearTimeout(t);
  }, [count, paused, next, index]);

  if (!count) return <HeroFallback />;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative h-[78svh] min-h-[520px] w-full overflow-hidden bg-charcoal sm:h-[86svh] sm:max-h-[920px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {banners.map((b, i) => {
        const src = publicImageUrl(b.image_path);
        const active = i === index;
        return (
          <div
            key={b.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={!active}
            className={cn("absolute inset-0 transition-opacity duration-[1400ms]", active ? "z-10 opacity-100" : "z-0 opacity-0")}
          >
            {src ? (
              <Image
                src={src}
                alt={b.title}
                fill
                sizes="100vw"
                quality={85}
                preload={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                className={cn("object-cover transition-transform duration-[8000ms] ease-out", active ? "scale-100" : "scale-[1.04]")}
              />
            ) : (
              <TextileArt seed={b.id} tone={0} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-charcoal/5" />
            <div className="absolute inset-x-0 bottom-0 pb-16 sm:pb-24">
              <div className="container-luxe flex flex-col items-center text-center text-ivory">
                {b.eyebrow && <p className="mb-5 text-[0.66rem] font-medium tracking-[0.36em] uppercase">{b.eyebrow}</p>}
                {i === 0 ? (
                  <h1 className="display-1 max-w-4xl text-ivory">{b.title}</h1>
                ) : (
                  <p className="display-1 max-w-4xl font-serif text-ivory">{b.title}</p>
                )}
                {b.subtitle && <p className="mt-5 max-w-xl text-[0.98rem] leading-relaxed text-ivory/85">{b.subtitle}</p>}
                {b.cta_label && b.cta_href && (
                  <Link href={b.cta_href} className="btn-light mt-9" tabIndex={active ? 0 : -1}>
                    {b.cta_label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-3">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className="group flex h-11 w-8 items-center justify-center"
            >
              <span className={cn("block h-px w-full transition-colors", i === index ? "bg-ivory" : "bg-ivory/40 group-hover:bg-ivory/70")} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/** Shown until the first banner is added in Admin → Homepage Banners. */
function HeroFallback() {
  return (
    <section className="relative overflow-hidden bg-burgundy text-ivory">
      <div className="grid min-h-[78svh] lg:min-h-[86svh] lg:max-h-[920px] lg:grid-cols-[1.05fr_1fr]">
        <div className="relative order-2 flex flex-col items-center justify-center px-6 py-16 text-center lg:order-1 lg:px-16">
          <Monogram className="mb-10 h-16 w-16 text-champagne" />
          <p className="mb-6 text-[0.66rem] font-medium tracking-[0.36em] text-champagne uppercase">{brand.fullName}</p>
          <h1 className="display-1 max-w-xl text-ivory">
            {brand.tagline.split(" ").slice(0, 2).join(" ")}{" "}
            <em className="font-serif text-champagne">{brand.tagline.split(" ").slice(2).join(" ")}</em>
          </h1>
          <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-ivory/80">
            Premium Indian fabrics and sarees, curated for timeless elegance.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/fabrics" className="btn-light">
              Explore Fabrics
            </Link>
            <Link href="/sarees" className="btn bg-ivory text-burgundy hover:bg-champagne">
              Discover Sarees
            </Link>
          </div>
        </div>
        <div className="relative order-1 min-h-[38svh] lg:order-2">
          <TextileArt seed="poojavi-hero" variant="ikat" tone={4} />
          <div className="absolute inset-6 border border-ivory/40 sm:inset-10" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
