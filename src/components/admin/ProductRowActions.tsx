"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { deleteProduct, setProductStatus } from "@/lib/actions/admin/products";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

export function ProductRowActions({ id, name, slug, status }: { id: string; name: string; slug: string; status: "draft" | "published" }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function toggleStatus() {
    startTransition(async () => {
      const res = await setProductStatus(id, status === "published" ? "draft" : "published");
      if (res.ok) {
        toast.success(res.message ?? "Updated.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res.ok) {
        setConfirming(false);
        toast.success(res.message ?? "Deleted.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={toggleStatus}
        disabled={pending}
        className="inline-flex h-10 items-center gap-1.5 px-3 text-xs tracking-[0.12em] uppercase hover:text-burgundy disabled:opacity-50"
        aria-label={status === "published" ? `Unpublish ${name}` : `Publish ${name}`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        <span className="hidden md:inline">{status === "published" ? "Unpublish" : "Publish"}</span>
      </button>
      <Link href={`/admin/products/${id}`} className="inline-flex h-10 w-10 items-center justify-center hover:text-burgundy" aria-label={`Edit ${name}`}>
        <Pencil className="h-4 w-4" />
      </Link>
      <button type="button" onClick={() => setConfirming(true)} disabled={pending} className="inline-flex h-10 w-10 items-center justify-center text-[#9b2c2c] hover:text-[#701b1b] disabled:opacity-50" aria-label={`Delete ${name}`}>
        <Trash2 className="h-4 w-4" />
      </button>
      <ConfirmDialog open={confirming} title="Delete product?" confirmLabel="Delete product" pending={pending} onConfirm={remove} onCancel={() => setConfirming(false)}>
        <p>
          <strong>{name}</strong> ({slug}) and all of its images will be permanently deleted and removed from every collection. This cannot be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}
