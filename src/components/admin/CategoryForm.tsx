"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { categorySchema, type CategoryInput } from "@/lib/validation/schemas";
import { createCategory, updateCategory } from "@/lib/actions/admin/categories";
import type { CategoryRow } from "@/lib/database.types";
import { slugify } from "@/lib/utils";
import { Card, Field } from "./ui";
import { Toggle } from "./Toggle";
import { SingleImageField } from "./ImageFields";
import { useToast } from "./Toast";

export function CategoryForm({ category }: { category?: CategoryRow }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      department: category?.department ?? "fabrics",
      image_path: category?.image_path ?? "",
      display_order: String(category?.display_order ?? 0),
      is_active: category?.is_active ?? true,
    },
  });
  const nameField = register("name");
  const busy = pending || uploading;

  const onSubmit = handleSubmit((values) => {
    if (busy) return;
    setFormError(null);
    startTransition(async () => {
      const res = category ? await updateCategory(category.id, values) : await createCategory(values);
      if (!res.ok) {
        for (const [f, m] of Object.entries(res.fieldErrors ?? {})) if (m?.[0] && f in values) setError(f as keyof CategoryInput, { message: m[0] });
        setFormError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved.");
      router.replace("/admin/categories");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
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
            <Field id="slug" label="URL slug" required error={errors.slug?.message} hint="/category/your-slug">
              <input id="slug" className="field-input" {...register("slug", { onChange: () => setSlugTouched(true) })} />
            </Field>
            <Field id="department" label="Department" required error={errors.department?.message} hint="Controls whether it appears under Fabrics or Sarees.">
              <select id="department" className="field-input" {...register("department")}>
                <option value="fabrics">Fabrics</option>
                <option value="sarees">Sarees</option>
              </select>
            </Field>
          </div>
          <Field id="description" label="Description" error={errors.description?.message}>
            <textarea id="description" rows={4} className="field-input" {...register("description")} />
          </Field>
          <Field id="display_order" label="Display order" error={errors.display_order?.message} hint="Lower numbers appear first.">
            <input id="display_order" inputMode="numeric" className="field-input max-w-40" {...register("display_order")} />
          </Field>
        </div>
      </Card>
      <div className="space-y-6">
        <Card>
          <Controller
            control={control}
            name="image_path"
            render={({ field }) => <SingleImageField folder="categories" label="Category image" value={field.value} onChange={field.onChange} onBusyChange={setUploading} hint="Portrait images (4:5) look best." />}
          />
        </Card>
        <Card>
          <Controller control={control} name="is_active" render={({ field }) => <Toggle id="is_active" label="Active" description="Inactive categories and their products are hidden from the website." checked={field.value} onChange={field.onChange} />} />
          {formError && (
            <p role="alert" className="mt-4 border border-[#9b2c2c]/30 bg-[#9b2c2c]/5 px-3 py-2 text-sm text-[#9b2c2c]">
              {formError}
            </p>
          )}
          <button type="submit" className="btn-primary mt-5 w-full" disabled={busy}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {category ? "Save changes" : "Create category"}
          </button>
        </Card>
      </div>
    </form>
  );
}
