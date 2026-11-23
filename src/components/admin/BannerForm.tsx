"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { bannerSchema, type BannerInput } from "@/lib/validation/schemas";
import { createBanner, deleteBanner, updateBanner } from "@/lib/actions/admin/banners";
import type { HomepageBannerRow } from "@/lib/database.types";
import { Card, Field } from "./ui";
import { Toggle } from "./Toggle";
import { SingleImageField } from "./ImageFields";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

export function BannerForm({ banner }: { banner?: HomepageBannerRow }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BannerInput>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      eyebrow: banner?.eyebrow ?? "",
      title: banner?.title ?? "",
      subtitle: banner?.subtitle ?? "",
      cta_label: banner?.cta_label ?? "",
      cta_href: banner?.cta_href ?? "",
      image_path: banner?.image_path ?? "",
      display_order: String(banner?.display_order ?? 0),
      is_active: banner?.is_active ?? true,
    },
  });
  const busy = pending || uploading;

  const onSubmit = handleSubmit((values) => {
    if (busy) return;
    setFormError(null);
    startTransition(async () => {
      const res = banner ? await updateBanner(banner.id, values) : await createBanner(values);
      if (!res.ok) {
        for (const [f, m] of Object.entries(res.fieldErrors ?? {})) if (m?.[0] && f in values) setError(f as keyof BannerInput, { message: m[0] });
        setFormError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved.");
      router.replace("/admin/banners");
      router.refresh();
    });
  });

  function onDelete() {
    if (!banner) return;
    startTransition(async () => {
      const res = await deleteBanner(banner.id);
      if (res.ok) {
        toast.success(res.message ?? "Deleted.");
        router.replace("/admin/banners");
        router.refresh();
      } else {
        toast.error(res.error);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <div className="space-y-5">
          <Field id="eyebrow" label="Eyebrow" error={errors.eyebrow?.message} hint="Small text above the title, e.g. “The Festive Edit”.">
            <input id="eyebrow" className="field-input" {...register("eyebrow")} />
          </Field>
          <Field id="title" label="Title" required error={errors.title?.message}>
            <input id="title" className="field-input" {...register("title")} />
          </Field>
          <Field id="subtitle" label="Subtitle" error={errors.subtitle?.message}>
            <textarea id="subtitle" rows={3} className="field-input" {...register("subtitle")} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="cta_label" label="Button label" error={errors.cta_label?.message}>
              <input id="cta_label" className="field-input" placeholder="Explore Sarees" {...register("cta_label")} />
            </Field>
            <Field id="cta_href" label="Button link" error={errors.cta_href?.message} hint="e.g. /sarees or /collections/wedding-edit">
              <input id="cta_href" className="field-input" placeholder="/sarees" {...register("cta_href")} />
            </Field>
          </div>
          <Field id="display_order" label="Display order" error={errors.display_order?.message} hint="Lower numbers show first.">
            <input id="display_order" inputMode="numeric" className="field-input max-w-40" {...register("display_order")} />
          </Field>
        </div>
      </Card>
      <div className="space-y-6">
        <Card>
          <Controller
            control={control}
            name="image_path"
            render={({ field }) => (
              <SingleImageField folder="banners" label="Banner image" value={field.value} onChange={field.onChange} onBusyChange={setUploading} aspect="aspect-[16/10]" hint="Landscape, at least 2400px wide for sharp results." />
            )}
          />
        </Card>
        <Card>
          <Controller control={control} name="is_active" render={({ field }) => <Toggle id="is_active" label="Show on homepage" checked={field.value} onChange={field.onChange} />} />
          {formError && (
            <p role="alert" className="mt-4 border border-[#9b2c2c]/30 bg-[#9b2c2c]/5 px-3 py-2 text-sm text-[#9b2c2c]">
              {formError}
            </p>
          )}
          <button type="submit" className="btn-primary mt-5 w-full" disabled={busy}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {banner ? "Save changes" : "Create banner"}
          </button>
          {banner && (
            <button type="button" className="btn-ghost mt-2 w-full text-[#9b2c2c]" onClick={() => setConfirmDelete(true)} disabled={busy}>
              Delete banner
            </button>
          )}
        </Card>
      </div>
      <ConfirmDialog open={confirmDelete} title="Delete this banner?" confirmLabel="Delete banner" pending={pending} onConfirm={onDelete} onCancel={() => setConfirmDelete(false)}>
        <p>The banner and its image will be permanently removed from the homepage.</p>
      </ConfirmDialog>
    </form>
  );
}
