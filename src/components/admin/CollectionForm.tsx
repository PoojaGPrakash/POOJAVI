"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Loader2, Search, X } from "lucide-react";
import { collectionSchema, type CollectionInput } from "@/lib/validation/schemas";
import { createCollection, deleteCollection, updateCollection } from "@/lib/actions/admin/collections";
import type { CollectionRow } from "@/lib/database.types";
import { publicImageUrl } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { Card, Field, StatusBadge } from "./ui";
import { Toggle } from "./Toggle";
import { SingleImageField } from "./ImageFields";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

export type ProductOption = { id: string; name: string; sku: string | null; status: "draft" | "published"; categoryName: string | null; imagePath: string | null };

export function CollectionForm({ collection, products }: { collection?: CollectionRow & { product_ids: string[] }; products: ProductOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(collection));
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [query, setQuery] = useState("");

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CollectionInput>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name ?? "",
      slug: collection?.slug ?? "",
      description: collection?.description ?? "",
      banner_path: collection?.banner_path ?? "",
      display_order: String(collection?.display_order ?? 0),
      is_active: collection?.is_active ?? true,
      is_featured: collection?.is_featured ?? false,
      product_ids: collection?.product_ids.filter((id) => byId.has(id)) ?? [],
    },
  });
  const nameField = register("name");
  const busy = pending || uploading;

  const onSubmit = handleSubmit((values) => {
    if (busy) return;
    setFormError(null);
    startTransition(async () => {
      const res = collection ? await updateCollection(collection.id, values) : await createCollection(values);
      if (!res.ok) {
        for (const [f, m] of Object.entries(res.fieldErrors ?? {})) if (m?.[0] && f in values) setError(f as keyof CollectionInput, { message: m[0] });
        setFormError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved.");
      router.replace("/admin/collections");
      router.refresh();
    });
  });

  function onDelete() {
    if (!collection) return;
    startTransition(async () => {
      const res = await deleteCollection(collection.id);
      if (res.ok) {
        toast.success(res.message ?? "Deleted.");
        router.replace("/admin/collections");
        router.refresh();
      } else {
        toast.error(res.error);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card title="Details">
          <div className="space-y-5">
            <Field id="name" label="Name" required error={errors.name?.message}>
              <input
                id="name"
                className="field-input"
                {...nameField}
                onChange={(e) => {
                  void nameField.onChange(e);
                  if (!slugTouched) setValue("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="slug" label="URL slug" required error={errors.slug?.message} hint="/collections/your-slug">
                <input id="slug" className="field-input" {...register("slug", { onChange: () => setSlugTouched(true) })} />
              </Field>
              <Field id="display_order" label="Display order" error={errors.display_order?.message} hint="Lower numbers appear first.">
                <input id="display_order" inputMode="numeric" className="field-input" {...register("display_order")} />
              </Field>
            </div>
            <Field id="description" label="Description" error={errors.description?.message}>
              <textarea id="description" rows={4} className="field-input" {...register("description")} />
            </Field>
          </div>
        </Card>

        <Card title="Products in this collection" description="Select products and arrange their order. Only published products are shown on the website.">
          <Controller
            control={control}
            name="product_ids"
            render={({ field }) => {
              const selected = field.value;
              const q = query.trim().toLowerCase();
              const available = products.filter((p) => !selected.includes(p.id) && (!q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)));
              const move = (i: number, d: number) => {
                const next = [...selected];
                const [x] = next.splice(i, 1);
                if (x) next.splice(i + d, 0, x);
                field.onChange(next);
              };
              return (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="field-label">Selected ({selected.length})</p>
                    {selected.length ? (
                      <ol className="max-h-[420px] divide-y divide-line overflow-y-auto border border-line">
                        {selected.map((id, i) => {
                          const p = byId.get(id);
                          if (!p) return null;
                          return (
                            <li key={id} className="flex items-center gap-2 p-2">
                              <Thumb path={p.imagePath} />
                              <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 disabled:opacity-30" aria-label={`Move ${p.name} up`}>
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" onClick={() => move(i, 1)} disabled={i === selected.length - 1} className="p-1.5 disabled:opacity-30" aria-label={`Move ${p.name} down`}>
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" onClick={() => field.onChange(selected.filter((x) => x !== id))} className="p-1.5 text-[#9b2c2c]" aria-label={`Remove ${p.name}`}>
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          );
                        })}
                      </ol>
                    ) : (
                      <p className="border border-dashed border-line p-6 text-center text-sm text-muted">No products selected.</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="product-search" className="field-label">
                      Add products
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input id="product-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or SKU" className="field-input pl-9" />
                    </div>
                    <ul className="mt-2 max-h-[360px] divide-y divide-line overflow-y-auto border border-line">
                      {available.slice(0, 100).map((p) => (
                        <li key={p.id}>
                          <button type="button" onClick={() => field.onChange([...selected, p.id])} className="flex w-full items-center gap-2 p-2 text-left hover:bg-ivory">
                            <Thumb path={p.imagePath} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm">{p.name}</span>
                              <span className="block truncate text-xs text-muted">{p.categoryName ?? "—"}</span>
                            </span>
                            {p.status === "draft" && <StatusBadge tone="amber">Draft</StatusBadge>}
                          </button>
                        </li>
                      ))}
                      {!available.length && <li className="p-4 text-center text-sm text-muted">{products.length ? "No matching products." : "No products yet."}</li>}
                    </ul>
                  </div>
                </div>
              );
            }}
          />
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <Controller
            control={control}
            name="banner_path"
            render={({ field }) => <SingleImageField folder="collections" label="Collection banner" value={field.value} onChange={field.onChange} onBusyChange={setUploading} aspect="aspect-[4/3]" hint="Landscape images work best." />}
          />
        </Card>
        <Card>
          <div className="space-y-3">
            <Controller control={control} name="is_active" render={({ field }) => <Toggle id="is_active" label="Active" description="Visible on the website." checked={field.value} onChange={field.onChange} />} />
            <Controller control={control} name="is_featured" render={({ field }) => <Toggle id="is_featured" label="Featured on homepage" description="Shown in “Explore Collections”." checked={field.value} onChange={field.onChange} />} />
          </div>
          {formError && (
            <p role="alert" className="mt-4 border border-[#9b2c2c]/30 bg-[#9b2c2c]/5 px-3 py-2 text-sm text-[#9b2c2c]">
              {formError}
            </p>
          )}
          <button type="submit" className="btn-primary mt-5 w-full" disabled={busy}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {collection ? "Save changes" : "Create collection"}
          </button>
          {collection && (
            <button type="button" className="btn-ghost mt-2 w-full text-[#9b2c2c]" onClick={() => setConfirmDelete(true)} disabled={busy}>
              Delete collection
            </button>
          )}
        </Card>
      </div>
      <ConfirmDialog open={confirmDelete} title="Delete this collection?" confirmLabel="Delete collection" pending={pending} onConfirm={onDelete} onCancel={() => setConfirmDelete(false)}>
        <p>The collection and its banner will be removed. The products themselves will not be deleted.</p>
      </ConfirmDialog>
    </form>
  );
}

function Thumb({ path }: { path: string | null }) {
  const url = publicImageUrl(path);
  return <span className="relative block h-10 w-8 shrink-0 overflow-hidden bg-beige">{url && <Image src={url} alt="" fill sizes="32px" className="object-cover" />}</span>;
}
