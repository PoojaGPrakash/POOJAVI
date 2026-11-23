import { cn } from "@/lib/utils";

/**
 * Decorative woven-pattern artwork used wherever an image has not been
 * uploaded yet (new categories, products awaiting photography, empty hero).
 * Deterministic per `seed`, so the same item always shows the same pattern.
 */
type Variant = "ikat" | "brocade" | "stripe" | "jaal";

const palettes = [
  { bg: "#551F32", fg: "#D6C2A1", accent: "#F8F5EF" },
  { bg: "#E9E0D4", fg: "#551F32", accent: "#B89D72" },
  { bg: "#282522", fg: "#D6C2A1", accent: "#8A6F4E" },
  { bg: "#F8F5EF", fg: "#B89D72", accent: "#551F32" },
  { bg: "#D6C2A1", fg: "#551F32", accent: "#F8F5EF" },
] as const;

const variants: Variant[] = ["ikat", "brocade", "stripe", "jaal"];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function TextileArt({
  seed,
  className,
  variant,
  tone,
}: {
  seed: string;
  className?: string;
  variant?: Variant;
  tone?: number;
}) {
  const h = hash(seed);
  const v = variant ?? variants[h % variants.length] ?? "ikat";
  const p = palettes[tone ?? (h >> 3) % palettes.length] ?? palettes[0];
  const pid = `pj-${v}-${h.toString(36)}`;

  return (
    <svg
      aria-hidden="true"
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 400 500"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {v === "ikat" && (
          <pattern id={pid} width="60" height="72" patternUnits="userSpaceOnUse">
            <path d="M30 4 L56 36 L30 68 L4 36 Z" fill="none" stroke={p.fg} strokeWidth="1.2" opacity="0.75" />
            <path d="M30 18 L44 36 L30 54 L16 36 Z" fill={p.fg} opacity="0.35" />
            <path d="M30 30 L35 36 L30 42 L25 36 Z" fill={p.accent} opacity="0.8" />
            <path d="M0 36 h3 M57 36 h3" stroke={p.fg} strokeWidth="1" opacity="0.5" />
          </pattern>
        )}
        {v === "brocade" && (
          <pattern id={pid} width="56" height="56" patternUnits="userSpaceOnUse">
            <g opacity="0.8" fill="none" stroke={p.fg} strokeWidth="1">
              <path d="M28 12 C34 18 34 26 28 30 C22 26 22 18 28 12 Z" fill={p.fg} fillOpacity="0.25" />
              <path d="M28 30 v10" />
              <path d="M28 36 c4 -2 7 -2 9 0 M28 36 c-4 -2 -7 -2 -9 0" />
            </g>
            <circle cx="0" cy="0" r="1.6" fill={p.accent} opacity="0.7" />
            <circle cx="56" cy="0" r="1.6" fill={p.accent} opacity="0.7" />
            <circle cx="0" cy="56" r="1.6" fill={p.accent} opacity="0.7" />
            <circle cx="56" cy="56" r="1.6" fill={p.accent} opacity="0.7" />
          </pattern>
        )}
        {v === "stripe" && (
          <pattern id={pid} width="400" height="40" patternUnits="userSpaceOnUse">
            <rect y="0" width="400" height="2" fill={p.fg} opacity="0.55" />
            <rect y="8" width="400" height="0.8" fill={p.fg} opacity="0.4" />
            <rect y="14" width="400" height="6" fill={p.fg} opacity="0.12" />
            <rect y="26" width="400" height="0.8" fill={p.accent} opacity="0.5" />
          </pattern>
        )}
        {v === "jaal" && (
          <pattern id={pid} width="80" height="80" patternUnits="userSpaceOnUse">
            <g fill="none" stroke={p.fg} strokeWidth="1" opacity="0.6">
              <path d="M0 40 Q20 20 40 40 T80 40" />
              <path d="M0 40 Q20 60 40 40 T80 40" />
              <path d="M40 0 Q20 20 40 40 T40 80" />
              <path d="M40 0 Q60 20 40 40 T40 80" />
            </g>
            <circle cx="40" cy="40" r="3" fill={p.accent} opacity="0.75" />
            <circle cx="0" cy="0" r="2" fill={p.fg} opacity="0.5" />
            <circle cx="80" cy="80" r="2" fill={p.fg} opacity="0.5" />
          </pattern>
        )}
        <linearGradient id={`${pid}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.10" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={p.bg} />
      <rect width="400" height="500" fill={`url(#${pid})`} />
      {/* Woven border (pallu-like) */}
      <rect x="0" y="420" width="400" height="80" fill={p.fg} opacity="0.12" />
      <rect x="0" y="420" width="400" height="1.5" fill={p.fg} opacity="0.6" />
      <rect x="0" y="428" width="400" height="0.8" fill={p.accent} opacity="0.6" />
      <rect width="400" height="500" fill={`url(#${pid}-sheen)`} />
    </svg>
  );
}
