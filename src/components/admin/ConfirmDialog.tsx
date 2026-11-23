"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "default";
  pending?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Accessible modal confirmation built on the native <dialog> element. */
export function ConfirmDialog({ open, title, children, confirmLabel = "Confirm", tone = "danger", pending = false, confirmDisabled = false, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md border border-line bg-ivory p-0 text-charcoal shadow-2xl backdrop:bg-charcoal/50"
    >
      <div className="p-6 sm:p-7">
        <h2 id={titleId} className="font-serif text-2xl">
          {title}
        </h2>
        {children && <div className="mt-3 space-y-3 text-sm leading-relaxed text-charcoal/75">{children}</div>}
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-outline" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className={tone === "danger" ? "btn bg-[#8b2323] text-white hover:bg-[#701b1b]" : "btn-primary"}
            onClick={onConfirm}
            disabled={pending || confirmDisabled}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
