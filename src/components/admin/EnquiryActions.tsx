"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, MailOpen, RotateCcw, Trash2 } from "lucide-react";
import { deleteEnquiry, setEnquiryStatus } from "@/lib/actions/admin/enquiries";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

export function EnquiryActions({ id, status }: { id: string; status: "new" | "read" | "archived" }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        after?.();
        toast.success(res.message ?? "Updated.");
        router.refresh();
      } else toast.error(res.error ?? "Failed.");
    });

  return (
    <div className="flex flex-wrap items-center gap-1">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
      {status === "new" && (
        <button type="button" className="btn-ghost !min-h-9 !px-2 text-xs" disabled={pending} onClick={() => run(() => setEnquiryStatus(id, "read"))}>
          <MailOpen className="h-4 w-4" /> Mark read
        </button>
      )}
      {status !== "archived" ? (
        <button type="button" className="btn-ghost !min-h-9 !px-2 text-xs" disabled={pending} onClick={() => run(() => setEnquiryStatus(id, "archived"))}>
          <Archive className="h-4 w-4" /> Archive
        </button>
      ) : (
        <button type="button" className="btn-ghost !min-h-9 !px-2 text-xs" disabled={pending} onClick={() => run(() => setEnquiryStatus(id, "new"))}>
          <RotateCcw className="h-4 w-4" /> Restore
        </button>
      )}
      <button type="button" className="btn-ghost !min-h-9 !px-2 text-xs text-[#9b2c2c]" disabled={pending} onClick={() => setConfirm(true)}>
        <Trash2 className="h-4 w-4" /> Delete
      </button>
      <ConfirmDialog open={confirm} title="Delete this enquiry?" confirmLabel="Delete" pending={pending} onConfirm={() => run(() => deleteEnquiry(id), () => setConfirm(false))} onCancel={() => setConfirm(false)}>
        <p>This enquiry will be permanently deleted.</p>
      </ConfirmDialog>
    </div>
  );
}
