"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { siteSettingsSchema, type SiteSettingsInput } from "@/lib/validation/schemas";
import { updateSiteSettings } from "@/lib/actions/admin/settings";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { Card, Field } from "./ui";
import { Toggle } from "./Toggle";
import { SingleImageField } from "./ImageFields";
import { useToast } from "./Toast";

const tabs = [
  { id: "contact", label: "Contact & WhatsApp" },
  { id: "homepage", label: "Homepage" },
  { id: "story", label: "Brand Story" },
  { id: "footer", label: "Footer & Policies" },
  { id: "seo", label: "SEO" },
] as const;
type Tab = (typeof tabs)[number]["id"];

const fieldTab: Partial<Record<keyof SiteSettingsInput, Tab>> = {
  whatsapp_number: "contact",
  whatsapp_default_message: "contact",
  instagram_handle: "contact",
  instagram_url: "contact",
  contact_email: "contact",
  contact_phone: "contact",
  contact_address: "contact",
  business_hours: "contact",
  announcement_text: "homepage",
  intro_eyebrow: "homepage",
  intro_heading: "homepage",
  intro_body: "homepage",
  story_heading: "story",
  story_body: "story",
  craft_heading: "story",
  craft_body: "story",
  footer_about: "footer",
  privacy_policy: "footer",
  terms_conditions: "footer",
  shipping_policy: "footer",
  returns_policy: "footer",
  seo_title: "seo",
  seo_description: "seo",
};

export function SettingsForm({ initial }: { initial: SiteSettingsInput }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("contact");
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<SiteSettingsInput>({ resolver: zodResolver(siteSettingsSchema), defaultValues: initial });

  const busy = pending || uploading;
  const waNumber = useWatch({ control, name: "whatsapp_number" });
  const waMessage = useWatch({ control, name: "whatsapp_default_message" });
  const testLink = buildWhatsAppLink(waNumber, waMessage);

  const onInvalid = (errs: Partial<Record<keyof SiteSettingsInput, unknown>>) => {
    const first = Object.keys(errs)[0] as keyof SiteSettingsInput | undefined;
    if (first && fieldTab[first]) setTab(fieldTab[first]!);
    toast.error("Please correct the highlighted fields.");
  };

  const onSubmit = handleSubmit((values) => {
    if (busy) return;
    startTransition(async () => {
      const res = await updateSiteSettings(values);
      if (!res.ok) {
        const entries = Object.entries(res.fieldErrors ?? {});
        for (const [f, m] of entries) if (m?.[0] && f in values) setError(f as FieldPath<SiteSettingsInput>, { message: m[0] });
        const first = entries[0]?.[0] as keyof SiteSettingsInput | undefined;
        if (first && fieldTab[first]) setTab(fieldTab[first]!);
        toast.error(res.error);
        return;
      }
      reset(values);
      toast.success(res.message ?? "Saved.");
      router.refresh();
    });
  }, onInvalid);

  const text = (name: keyof SiteSettingsInput, label: string, opts: { hint?: string; rows?: number; placeholder?: string; type?: string } = {}) => {
    const err = errors[name]?.message;
    return (
      <Field id={name} label={label} hint={opts.hint} error={typeof err === "string" ? err : undefined}>
        {opts.rows ? (
          <textarea id={name} rows={opts.rows} className="field-input" placeholder={opts.placeholder} {...register(name)} />
        ) : (
          <input id={name} type={opts.type ?? "text"} className="field-input" placeholder={opts.placeholder} {...register(name)} />
        )}
      </Field>
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Settings sections">
        <div className="flex w-max gap-1 border-b border-line sm:w-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn("min-h-11 border-b-2 px-4 text-sm whitespace-nowrap transition-colors", tab === t.id ? "border-burgundy text-burgundy" : "border-transparent text-charcoal/60 hover:text-charcoal")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={tab === "contact" ? "space-y-6" : "hidden"} role="tabpanel">
        <Card title="WhatsApp" description="Used by every WhatsApp button on the website — the single source of truth.">
          <div className="space-y-5">
            {text("whatsapp_number", "WhatsApp business number", { hint: "Include the country code, e.g. +91 98765 43210", type: "tel" })}
            {text("whatsapp_default_message", "Default message", { rows: 2, hint: "Pre-filled for general enquiries. Product pages use a product-specific message." })}
            {testLink ? (
              <a href={testLink} target="_blank" rel="noopener noreferrer" className="link-underline text-burgundy">
                Test this WhatsApp link
              </a>
            ) : (
              <p className="text-xs text-muted">WhatsApp buttons are hidden on the website until a valid number is saved.</p>
            )}
          </div>
        </Card>
        <Card title="Contact details">
          <div className="grid gap-5 sm:grid-cols-2">
            {text("contact_email", "Email", { type: "email" })}
            {text("contact_phone", "Phone", { type: "tel" })}
            {text("instagram_handle", "Instagram handle", { placeholder: "poojavithelabel" })}
            {text("instagram_url", "Instagram profile URL", { placeholder: "https://www.instagram.com/…" })}
            {text("business_hours", "Business hours", { placeholder: "Mon–Sat, 10am–7pm IST" })}
            {text("contact_address", "Studio address", { rows: 3 })}
          </div>
        </Card>
      </div>

      <div className={tab === "homepage" ? "space-y-6" : "hidden"} role="tabpanel">
        <Card title="Announcement bar">
          <div className="space-y-4">
            <Controller control={control} name="announcement_enabled" render={({ field }) => <Toggle id="announcement_enabled" label="Show announcement bar" checked={field.value} onChange={field.onChange} />} />
            {text("announcement_text", "Announcement text")}
          </div>
        </Card>
        <Card title="Brand introduction" description="The welcome section below the hero banner.">
          <div className="space-y-5">
            {text("intro_eyebrow", "Eyebrow")}
            {text("intro_heading", "Heading")}
            {text("intro_body", "Text", { rows: 5 })}
          </div>
        </Card>
        <p className="text-sm text-charcoal/65">
          Hero banners, featured collections and the Instagram gallery are managed in their own sections of the dashboard.
        </p>
      </div>

      <div className={tab === "story" ? "space-y-6" : "hidden"} role="tabpanel">
        <Card title="Our Story" description="Shown on the homepage and the Our Story page. Separate paragraphs with a blank line.">
          <div className="grid gap-6 md:grid-cols-[1fr_260px]">
            <div className="space-y-5">
              {text("story_heading", "Heading")}
              {text("story_body", "Story", { rows: 12 })}
            </div>
            <Controller control={control} name="story_image_path" render={({ field }) => <SingleImageField folder="site" label="Story image" value={field.value} onChange={field.onChange} onBusyChange={setUploading} />} />
          </div>
        </Card>
        <Card title="Craftsmanship & Heritage">
          <div className="grid gap-6 md:grid-cols-[1fr_260px]">
            <div className="space-y-5">
              {text("craft_heading", "Heading")}
              {text("craft_body", "Text", { rows: 8 })}
            </div>
            <Controller control={control} name="craft_image_path" render={({ field }) => <SingleImageField folder="site" label="Craft image" value={field.value} onChange={field.onChange} onBusyChange={setUploading} />} />
          </div>
        </Card>
      </div>

      <div className={tab === "footer" ? "space-y-6" : "hidden"} role="tabpanel">
        <Card title="Footer">{text("footer_about", "Footer text", { rows: 3 })}</Card>
        <Card title="Policies" description="Plain text. Separate paragraphs with a blank line.">
          <div className="space-y-5">
            {text("privacy_policy", "Privacy Policy", { rows: 8 })}
            {text("terms_conditions", "Terms & Conditions", { rows: 8 })}
            {text("shipping_policy", "Shipping Policy", { rows: 6 })}
            {text("returns_policy", "No Returns Policy", { rows: 6 })}
          </div>
        </Card>
      </div>

      <div className={tab === "seo" ? "space-y-6" : "hidden"} role="tabpanel">
        <Card title="Search engines & sharing">
          <div className="space-y-5">
            {text("seo_title", "Homepage title", { hint: "Shown in browser tabs and search results." })}
            {text("seo_description", "Meta description", { rows: 3, hint: "Up to 300 characters; around 155 is ideal." })}
          </div>
        </Card>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-end gap-3 border-t border-line bg-[#f3efe8]/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        {isDirty && <span className="text-xs text-muted">Unsaved changes</span>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save settings
        </button>
      </div>
    </form>
  );
}
