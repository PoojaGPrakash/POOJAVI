"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Pencil } from "lucide-react";
import { reorderCollections, setCollectionActive } from "@/lib/actions/admin/collections";
import type { AdminCollection } from "@/lib/data/admin";
import { publicImageUrl } from "@/lib/storage";
import { StatusBadge } from "./ui";
import { Toggle } from "./Toggle";
import { useToast } from "./Toast";

export function CollectionList({ collections }: { collections: AdminCollection[] }) {
  const router = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState(collections.map((c) => c.id));
  const [source, setSource] = useState(collections);
  const [pending, startTransition] = useTransition();

  if (source !== collections) {
    setSource(collections);
    setOrder(collections.map((c) => c.id));
  }

  const byId = new Map(collections.map((c) => [c.id, c]));
  const dirty = order.join() !== collections.map((c) => c.id).join();

  function move(i: number, d: number) {
    const next = [...order];
    const [x] = next.splice(i, 1);
    if (x) next.splice(i + d, 0, x);
    setOrder(next);
  }

  function saveOrder() {
    startTransition(async () => {
      const res = await reorderCollections(order);
      if (res.ok) {
        toast.success(res.message ?? "Saved.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function toggle(id: string, v: boolean) {
    startTransition(async () => {
      const res = await setCollectionActive(id, v);
      if (res.ok) {
        toast.success(res.message ?? "Updated.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <>
      {dirty && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-champagne bg-champagne/20 px-4 py-3 text-sm">
          <span>You have changed the display order.</span>
          <div className="flex gap-2">
            <button type="button" className="btn-outline !min-h-9" onClick={() => setOrder(collections.map((c) => c.id))} disabled={pending}>
              Reset
            </button>
            <button type="button" className="btn-primary !min-h-9" onClick={saveOrder} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save order
            </button>
          </div>
        </div>
      )}
      <ul className="divide-y divide-line border border-line bg-white">
        {order.map((id, i) => {
          const c = byId.get(id);
          if (!c) return null;
          const img = publicImageUrl(c.banner_path);
          return (
            <li key={id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-4">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || pending} className="p-1 disabled:opacity-25" aria-label={`Move ${c.name} up`}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1 || pending} className="p-1 disabled:opacity-25" aria-label={`Move ${c.name} down`}>
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <Link href={`/admin/collections/${c.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative h-12 w-16 shrink-0 overflow-hidden bg-beige">{img && <Image src={img} alt="" fill sizes="64px" className="object-cover" />}</div>
                <div className="min-w-0">
                  <p className="truncate font-medium hover:text-burgundy">{c.name}</p>
                  <p className="text-xs text-muted">
                    /{c.slug} · {c.product_count} product{c.product_count === 1 ? "" : "s"}
                  </p>
                  <div className="mt-1 flex gap-1.5">
                    {c.is_featured && <StatusBadge tone="burgundy">Homepage</StatusBadge>}
                    {!c.is_active && <StatusBadge tone="amber">Hidden</StatusBadge>}
                  </div>
                </div>
              </Link>
              <div className="w-24">
                <Toggle id={`c-active-${c.id}`} label={c.is_active ? "Active" : "Hidden"} checked={c.is_active} onChange={(v) => toggle(c.id, v)} disabled={pending} />
              </div>
              <Link href={`/admin/collections/${c.id}`} className="inline-flex h-10 w-10 items-center justify-center hover:text-burgundy" aria-label={`Edit ${c.name}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
