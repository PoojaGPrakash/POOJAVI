import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center border border-line/70 bg-white/40 px-6 py-16 text-center sm:py-20">
      <Monogram className="mb-6 h-12 w-12 text-champagne-dark" />
      <h2 className="heading-3">{title}</h2>
      {description && <p className="body-lg mt-3 max-w-md">{description}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-outline mt-8">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
