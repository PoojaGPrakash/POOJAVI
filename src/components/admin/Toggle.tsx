"use client";

import { cn } from "@/lib/utils";

/** Accessible switch (role="switch"). */
export function Toggle({ id, checked, onChange, label, description, disabled }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-charcoal">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-charcoal/55">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-burgundy" : "bg-charcoal/20",
        )}
      >
        <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
    </div>
  );
}
