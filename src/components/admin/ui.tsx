import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FieldError } from "@/components/ui/FieldError";

export function AdminPageHeader({ title, description, action, back }: { title: string; description?: string; action?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-3 inline-block text-xs tracking-[0.16em] text-muted uppercase hover:text-burgundy">
            ← {back.label}
          </Link>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-charcoal/65">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Card({ children, className, title, description }: { children: ReactNode; className?: string; title?: string; description?: string }) {
  return (
    <section className={cn("border border-line bg-white p-5 sm:p-7", className)}>
      {title && (
        <header className="mb-5">
          <h2 className="font-serif text-xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-charcoal/60">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({ id, label, hint, error, children, required, className }: { id: string; label: string; hint?: string; error?: string; children: ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="text-burgundy"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

export function StatusBadge({ tone, children }: { tone: "green" | "amber" | "grey" | "burgundy"; children: ReactNode }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-700/20",
    amber: "bg-amber-50 text-amber-800 border-amber-700/20",
    grey: "bg-beige/60 text-charcoal/70 border-line",
    burgundy: "bg-burgundy/5 text-burgundy border-burgundy/20",
  } as const;
  return <span className={cn("inline-flex items-center border px-2 py-0.5 text-[0.62rem] font-medium tracking-[0.12em] whitespace-nowrap uppercase", tones[tone])}>{children}</span>;
}

export function EmptyAdminState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <h2 className="font-serif text-2xl">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm text-charcoal/65">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
