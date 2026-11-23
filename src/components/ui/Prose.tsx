import { toParagraphs } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Renders admin-managed plain text as paragraphs (no HTML injection). */
export function Prose({ text, className }: { text: string | null | undefined; className?: string }) {
  const paragraphs = toParagraphs(text);
  if (!paragraphs.length) return null;
  return (
    <div className={cn("space-y-5", className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className="body-lg whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}
