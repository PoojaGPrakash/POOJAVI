"use server";

import { adminAction, dbError, fail, removeStorageObjects, revalidateStorefront, validate } from "./helpers";
import { siteSettingsSchema, type SiteSettingsInput } from "@/lib/validation/schemas";
import { emptyToNull } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

export async function updateSiteSettings(input: SiteSettingsInput): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const v = validate(siteSettingsSchema, input);
    if (!v.ok) return v;
    const d = v.data;
    const { data: before } = await supabase.from("site_settings").select("story_image_path, craft_image_path").eq("id", 1).maybeSingle();

    const { error, count } = await supabase
      .from("site_settings")
      .update(
        {
          announcement_text: emptyToNull(d.announcement_text),
          announcement_enabled: d.announcement_enabled,
          intro_eyebrow: emptyToNull(d.intro_eyebrow),
          intro_heading: emptyToNull(d.intro_heading),
          intro_body: emptyToNull(d.intro_body),
          story_heading: emptyToNull(d.story_heading),
          story_body: emptyToNull(d.story_body),
          story_image_path: emptyToNull(d.story_image_path),
          craft_heading: emptyToNull(d.craft_heading),
          craft_body: emptyToNull(d.craft_body),
          craft_image_path: emptyToNull(d.craft_image_path),
          whatsapp_number: emptyToNull(d.whatsapp_number),
          whatsapp_default_message: emptyToNull(d.whatsapp_default_message),
          instagram_handle: emptyToNull(d.instagram_handle?.replace(/^@/, "")),
          instagram_url: emptyToNull(d.instagram_url),
          contact_email: emptyToNull(d.contact_email),
          contact_phone: emptyToNull(d.contact_phone),
          contact_address: emptyToNull(d.contact_address),
          business_hours: emptyToNull(d.business_hours),
          footer_about: emptyToNull(d.footer_about),
          privacy_policy: emptyToNull(d.privacy_policy),
          terms_conditions: emptyToNull(d.terms_conditions),
          shipping_policy: emptyToNull(d.shipping_policy),
          returns_policy: emptyToNull(d.returns_policy),
          seo_title: emptyToNull(d.seo_title),
          seo_description: emptyToNull(d.seo_description),
        },
        { count: "exact" },
      )
      .eq("id", 1);
    if (error) return dbError(error);
    if (!count) return fail("Site settings row is missing. Run the database seed migration.");

    const stale = [
      before?.story_image_path !== emptyToNull(d.story_image_path) ? before?.story_image_path : null,
      before?.craft_image_path !== emptyToNull(d.craft_image_path) ? before?.craft_image_path : null,
    ];
    await removeStorageObjects(supabase, stale);
    revalidateStorefront();
    return { ok: true, data: undefined, message: "Settings saved. The website has been updated." };
  });
}
