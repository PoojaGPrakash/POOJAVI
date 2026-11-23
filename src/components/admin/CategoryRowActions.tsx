"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { deleteCategory, setCategoryActive } from "@/lib/actions/admin/categories";
import { ConfirmDialog } from "./ConfirmDialog";
import { Toggle } from "./Toggle";
import { useToast } from "./Toast";

type Option = { id: string; name: string };

export function CategoryRowActions({ id, name, isActive, productCount, otherCategories }: { id: string; name: string; isActive: boolean; productCount: number; otherCategories: Option[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState<"reassign" | "delete_products">("reassign");
  const [target, setTarget] = useState("");
  const [typed, setTyped] = useState("");

  function toggle(v: boolean) {
    startTransition(async () => {
      const res = await setCategoryActive(id, v);
      if (res.ok) {
        toast.success(res.message ?? "Updated.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteCategory({
        id,
        strategy: productCount === 0 ? "none" : strategy,
        reassign_to: productCount > 0 && strategy === "reassign" ? target : "",
      });
      if (res.ok) {
        setOpen(false);
        toast.success(res.message ?? "Deleted.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  const confirmDisabled = productCount > 0 && ((strategy === "reassign" && !target) || (strategy === "delete_products" && typed !== "DELETE"));

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="w-24">
        <Toggle id={`active-${id}`} label={isActive ? "Active" : "Hidden"} checked={isActive} onChange={toggle} disabled={pending} />
      </div>
      <Link href={`/admin/categories/${id}`} className="inline-flex h-10 w-10 items-center justify-center hover:text-burgundy" aria-label={`Edit ${name}`}>
        <Pencil className="h-4 w-4" />
      </Link>
      <button type="button" onClick={() => setOpen(true)} disabled={pending} className="inline-flex h-10 w-10 items-center justify-center text-[#9b2c2c] disabled:opacity-50" aria-label={`Delete ${name}`}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
      <ConfirmDialog
        open={open}
        title={`Delete “${name}”?`}
        confirmLabel="Delete category"
        pending={pending}
        confirmDisabled={confirmDisabled}
        onConfirm={confirmDelete}
        onCancel={() => setOpen(false)}
      >
        {productCount === 0 ? (
          <p>This category has no products. It will be permanently deleted.</p>
        ) : (
          <>
            <p>
              This category contains <strong>{productCount}</strong> product{productCount === 1 ? "" : "s"}. Choose what should happen to them:
            </p>
            <fieldset className="space-y-3">
              <legend className="sr-only">Products in this category</legend>
              <label className="flex items-start gap-2.5">
                <input type="radio" name={`strategy-${id}`} className="mt-1 accent-burgundy" checked={strategy === "reassign"} onChange={() => setStrategy("reassign")} />
                <span>Move them to another category</span>
              </label>
              {strategy === "reassign" && (
                <select aria-label="Move products to" value={target} onChange={(e) => setTarget(e.target.value)} className="field-input">
                  <option value="">Select a category…</option>
                  {otherCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              <label className="flex items-start gap-2.5">
                <input type="radio" name={`strategy-${id}`} className="mt-1 accent-burgundy" checked={strategy === "delete_products"} onChange={() => setStrategy("delete_products")} />
                <span>Permanently delete the products and their images</span>
              </label>
              {strategy === "delete_products" && (
                <div>
                  <label htmlFor={`typed-${id}`} className="text-xs text-charcoal/70">
                    Type <strong>DELETE</strong> to confirm
                  </label>
                  <input id={`typed-${id}`} value={typed} onChange={(e) => setTyped(e.target.value)} className="field-input mt-1" autoComplete="off" />
                </div>
              )}
            </fieldset>
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
