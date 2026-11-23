import Link from "next/link";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "dark" | "light";
  showTagline?: boolean;
  href?: string | null;
};

const sizes = {
  sm: { word: "text-[1.35rem] tracking-[0.3em]", label: "text-[0.5rem] tracking-[0.55em]", tag: "text-[0.5rem]" },
  md: { word: "text-[1.7rem] sm:text-[1.95rem] tracking-[0.32em]", label: "text-[0.52rem] sm:text-[0.56rem] tracking-[0.6em]", tag: "text-[0.55rem]" },
  lg: { word: "text-[2.4rem] tracking-[0.32em]", label: "text-[0.62rem] tracking-[0.62em]", tag: "text-[0.6rem]" },
  xl: { word: "text-[2.8rem] sm:text-[3.6rem] tracking-[0.3em]", label: "text-[0.66rem] sm:text-[0.78rem] tracking-[0.66em]", tag: "text-[0.62rem] sm:text-[0.7rem]" },
} as const;

/**
 * POOJAVI wordmark with THE LABEL set beneath and an optional WEAR A STORY
 * tagline. Rendered as live text in the brand serif for crisp legibility at
 * every size and full accessibility.
 */
export function Logo({ className, size = "md", tone = "dark", showTagline = false, href = "/" }: LogoProps) {
  const s = sizes[size];
  const colour = tone === "dark" ? "text-charcoal" : "text-ivory";
  const accent = tone === "dark" ? "bg-champagne-dark/70" : "bg-champagne/80";

  const mark = (
    <span className={cn("inline-flex flex-col items-center leading-none", colour, className)}>
      {/* Negative right margin compensates for trailing letter-spacing so the word is optically centred. */}
      <span className={cn("font-serif font-medium uppercase", s.word)} style={{ marginRight: "-0.3em" }}>
        {brand.name}
      </span>
      <span className="mt-[0.45em] flex items-center gap-[0.6em]" aria-hidden="true">
        <span className={cn("h-px w-5 sm:w-6", accent)} />
        <span className={cn("font-sans font-normal uppercase", s.label)} style={{ marginRight: "-0.6em" }}>
          {brand.label}
        </span>
        <span className={cn("h-px w-5 sm:w-6", accent)} />
      </span>
      {showTagline && (
        <span className={cn("mt-[1.1em] font-serif italic tracking-[0.22em] uppercase opacity-80", s.tag)}>{brand.tagline}</span>
      )}
    </span>
  );

  const label = `${brand.name} ${brand.label}${showTagline ? ` — ${brand.tagline}` : ""}`;
  if (!href) return <span aria-label={label} role="img">{mark}</span>;
  return (
    <Link href={href} aria-label={`${brand.fullName} — home`} className="inline-flex">
      {mark}
    </Link>
  );
}
