import { cn } from "@/lib/utils";

type MonogramProps = {
  className?: string;
  /** "solid": burgundy tile with champagne P. "line": P only, inherits currentColor. */
  variant?: "solid" | "line";
  title?: string;
};

/** P monogram — drawn as vector paths so it renders identically everywhere. */
export function Monogram({ className, variant = "line", title }: MonogramProps) {
  const labelled = Boolean(title);
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={title}
    >
      {variant === "solid" && <rect width="64" height="64" fill="#551F32" />}
      <circle
        cx="32"
        cy="32"
        r="27"
        fill="none"
        stroke={variant === "solid" ? "#D6C2A1" : "currentColor"}
        strokeWidth="0.9"
        opacity={variant === "solid" ? 0.9 : 0.55}
      />
      <g fill={variant === "solid" ? "#F8F5EF" : "currentColor"}>
        <path d="M25.2 18.5h4.3v27h-4.3z" />
        <path d="M21.5 18h11.2v1.3H21.5zM21.5 44.7h11.2V46H21.5z" />
        <path d="M29.5 18h6.6a8.7 8.7 0 0 1 0 17.4h-6.6v-1.6h5.7a7.1 7.1 0 0 0 0-14.2h-5.7z" />
      </g>
    </svg>
  );
}
