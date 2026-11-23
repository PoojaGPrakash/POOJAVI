"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Wand2 } from "lucide-react";
import { productSchema, type ProductInput } from "@/lib/validation/schemas";
import { createProduct, deleteProduct, updateProduct } from "@/lib/actions/admin/products";
import type { AdminProductDetail } from "@/lib/data/admin";
import { slugify } from "@/lib/utils";
import { Card, Field } from "./ui";
import { Toggle } from "./Toggle";
import { MultiImageField } from "./ImageFields";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

type CategoryOption = { id: string; name: string; department: "fabrics" | "sarees"; is_active: boolean };
type CollectionOption = { id: string; name: string; is_active: boolean };

export function ProductForm({ product, categories, collections }: { product?: AdminProductDetail; categories: CategoryOption[]; collections: CollectionOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    getValues,
    formState: { errors, isDirty },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      category_id: product?.category_id ?? "",
      sku: product?.sku ?? "",
      short_description: product?.short_description ?? "",
      description: product?.description ?? "",
      fabric_details: product?.fabric_details ?? "",
      weaving_technique: product?.weaving_technique ?? "",
      colours: product?.colours.join(", ") ?? "",
      is_featured: product?.is_featured ?? false,
      is_new_arrival: product?.is_new_arrival ?? false,
      status: product?.status ?? "draft",
      images: product?.images.map((i) => ({ storage_path: i.storage_path, alt_text: i.alt_text ?? "" })) ?? [],
      collection_ids: product?.collection_ids ?? [],
    },
  });

  const busy = pending || uploading;
  const nameField = register("name");

  function submit(status: "draft" | "published") {
    setValue("status", status, { shouldDirty: true });
    void handleSubmit((values) => {
      if (busy) return;
      setFormError(null);
      startTransition(async () => {
        const res = product ? await updateProduct(product.id, values) : await createProduct(values);
        if (!res.ok) {
          for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
            if (messages?.[0] && field in values) setError(field as keyof ProductInput, { message: messages[0] });
          }
          setFormError(res.error);
          toast.error(res.error);
          return;
        }
        toast.success(res.message ?? "Saved.");
        if (product) router.refresh();
        else router.replace(`/admin/products/${res.data.id}`);
      });
    }, () => setFormError("Please correct the highlighted fields."))();
  }

  function onDelete() {
    if (!product) return;
    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (res.ok) {
        toast.success(res.message ?? "Deleted.");
        router.replace("/admin/products");
      } else {
        toast.error(res.error);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(getValues("status"));
      }}
      noValidate
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <div className="space-y-6">
        <Card title="Details">
          <div className="space-y-5">
            <Field id="name" label="Product name" required error={errors.name?.message}>
              <input
                id="name"
                className="field-input"
                aria-invalid={Boolean(errors.name)}
                {...nameField}
                onChange={(e) => {
                  void nameField.onChange(e);
                  if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldValidate: false });
                }}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="slug" label="URL slug" required error={errors.slug?.message} hint="Used in the product's web address.">
                <div className="flex">
                  <input id="slug" className="field-input" aria-invalid={Boolean(errors.slug)} {...register("slug", { onChange: () => setSlugTouched(true) })} />
                  <button
                    type="button"
                    className="border border-l-0 border-line px-3 text-charcoal/60 hover:text-burgundy"
                    aria-label="Generate slug from name"
                    title="Generate from name"
                    onClick={() => setValue("slug", slugify(getValues("name")), { shouldDirty: true, shouldValidate: true })}
                  >
                    <Wand2 className="h-4 w-4" />
                  </button>
                </div>
              </Field>
              <Field id="sku" label="SKU / reference" error={errors.sku?.message} hint="Optional. Must be unique.">
                <input id="sku" className="field-input" aria-invalid={Boolean(errors.sku)} {...register("sku")} />
              </Field>
            </div>
            <Field id="short_description" label="Short description" error={errors.short_description?.message} hint="Shown on product cards (max 300 characters).">
              <textarea id="short_description" rows={2} className="field-input" {...register("short_description")} />
            </Field>
            <Field id="description" label="Description" error={errors.description?.message} hint="Separate paragraphs with a blank line.">
              <textarea id="description" rows={6} className="field-input" {...register("description")} />
            </Field>
          </div>
        </Card>

        <Card title="Images" description="Upload up to 12 images. Drag order with the arrows — the first image is the cover.">
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <MultiImageField folder="products" value={field.value} onChange={(v) => field.onChange(v)} error={errors.images?.message ?? errors.images?.root?.message} onBusyChange={setUploading} />
            )}
          />
        </Card>

        <Card title="Textile details">
          <div className="space-y-5">
            <Field id="fabric_details" label="Fabric details" error={errors.fabric_details?.message} hint="Composition, width, length, weight, care…">
              <textarea id="fabric_details" rows={4} className="field-input" {...register("fabric_details")} />
            </Field>
            <Field id="weaving_technique" label="Weaving technique" error={errors.weaving_technique?.message}>
              <input id="weaving_technique" className="field-input" {...register("weaving_technique")} />
            </Field>
            <Field id="colours" label="Available colours" error={errors.colours?.message} hint="Separate with commas, e.g. Ivory, Antique Gold, Ruby">
              <input id="colours" className="field-input" {...register("colours")} />
            </Field>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Publishing">
          <div className="space-y-4">
            <p className="text-sm text-charcoal/70">
              Current status:{" "}
              <strong className="text-charcoal">{product ? (product.status === "published" ? "Published" : "Draft") : "Not saved yet"}</strong>
            </p>
            <Controller
              control={control}
              name="is_featured"
              render={({ field }) => <Toggle id="is_featured" label="Featured" description="Show on the homepage." checked={field.value} onChange={field.onChange} />}
            />
            <Controller
              control={control}
              name="is_new_arrival"
              render={({ field }) => <Toggle id="is_new_arrival" label="New arrival" description="Show in New Arrivals." checked={field.value} onChange={field.onChange} />}
            />
            {formError && (
              <p role="alert" className="border border-[#9b2c2c]/30 bg-[#9b2c2c]/5 px-3 py-2 text-sm text-[#9b2c2c]">
                {formError}
              </p>
            )}
            {uploading && <p className="text-xs text-muted">Waiting for uploads to finish…</p>}
            <div className="flex flex-col gap-2 pt-2">
              <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => submit("published")}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {product?.status === "published" ? "Save & keep published" : "Publish"}
              </button>
              <button type="button" className="btn-outline w-full" disabled={busy} onClick={() => submit("draft")}>
                {product?.status === "published" ? "Unpublish & save as draft" : "Save as draft"}
              </button>
            </div>
            {product && !isDirty && <p className="text-center text-xs text-muted">No unsaved changes.</p>}
          </div>
        </Card>

        <Card title="Organisation">
          <div className="space-y-5">
            <Field id="category_id" label="Category" required error={errors.category_id?.message}>
              <select id="category_id" className="field-input" aria-invalid={Boolean(errors.category_id)} {...register("category_id")}>
                <option value="">Select a category…</option>
                {(["fabrics", "sarees"] as const).map((dept) => (
                  <optgroup key={dept} label={dept === "fabrics" ? "Fabrics" : "Sarees"}>
                    {categories
                      .filter((c) => c.department === dept)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {c.is_active ? "" : " (inactive)"}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <fieldset>
              <legend className="field-label">Collections</legend>
              {collections.length ? (
                <Controller
                  control={control}
                  name="collection_ids"
                  render={({ field }) => (
                    <ul className="max-h-60 space-y-1 overflow-y-auto border border-line p-2">
                      {collections.map((c) => {
                        const checked = field.value.includes(c.id);
                        return (
                          <li key={c.id}>
                            <label className="flex min-h-9 cursor-pointer items-center gap-2.5 px-1 text-sm">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-burgundy"
                                checked={checked}
                                onChange={() => field.onChange(checked ? field.value.filter((x) => x !== c.id) : [...field.value, c.id])}
                              />
                              {c.name}
                              {!c.is_active && <span className="text-xs text-muted">(inactive)</span>}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                />
              ) : (
                <p className="text-sm text-muted">No collections yet.</p>
              )}
            </fieldset>
          </div>
        </Card>

        {product && (
          <Card title="Danger zone">
            <button type="button" className="btn w-full border border-[#9b2c2c]/40 text-[#9b2c2c] hover:bg-[#9b2c2c] hover:text-white" onClick={() => setConfirmDelete(true)} disabled={busy}>
              Delete product
            </button>
          </Card>
        )}
      </div>

      <ConfirmDialog open={confirmDelete} title="Delete this product?" confirmLabel="Delete permanently" pending={pending} onConfirm={onDelete} onCancel={() => setConfirmDelete(false)}>
        <p>The product, its images and collection assignments will be permanently removed. This cannot be undone.</p>
      </ConfirmDialog>
    </form>
  );
}
