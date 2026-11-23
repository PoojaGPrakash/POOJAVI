import type { Metadata } from "next";
import { AdminPageHeader, EmptyAdminState } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdminPage } from "@/lib/auth";
import { getSettings } from "@/lib/data/admin";
import type { SiteSettingsInput } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Site content & settings" };

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdminPage();
  const s = await getSettings(supabase);
  if (!s) return <EmptyAdminState title="Settings row missing" description="Run the seed migration (supabase/migrations/…_seed.sql) to create it." />;
  const initial: SiteSettingsInput = {
    announcement_text: s.announcement_text ?? "",
    announcement_enabled: s.announcement_enabled,
    intro_eyebrow: s.intro_eyebrow ?? "",
    intro_heading: s.intro_heading ?? "",
    intro_body: s.intro_body ?? "",
    story_heading: s.story_heading ?? "",
    story_body: s.story_body ?? "",
    story_image_path: s.story_image_path ?? "",
    craft_heading: s.craft_heading ?? "",
    craft_body: s.craft_body ?? "",
    craft_image_path: s.craft_image_path ?? "",
    whatsapp_number: s.whatsapp_number ?? "",
    whatsapp_default_message: s.whatsapp_default_message ?? "",
    instagram_handle: s.instagram_handle ?? "",
    instagram_url: s.instagram_url ?? "",
    contact_email: s.contact_email ?? "",
    contact_phone: s.contact_phone ?? "",
    contact_address: s.contact_address ?? "",
    business_hours: s.business_hours ?? "",
    footer_about: s.footer_about ?? "",
    privacy_policy: s.privacy_policy ?? "",
    terms_conditions: s.terms_conditions ?? "",
    shipping_policy: s.shipping_policy ?? "",
    returns_policy: s.returns_policy ?? "",
    seo_title: s.seo_title ?? "",
    seo_description: s.seo_description ?? "",
  };
  return (
    <>
      <AdminPageHeader title="Site content & settings" description="Changes are published to the website as soon as you save." />
      <SettingsForm initial={initial} />
    </>
  );
}
