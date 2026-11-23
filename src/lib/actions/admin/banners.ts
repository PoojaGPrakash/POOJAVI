"use server";

import { adminAction, dbError, fail, removeStorageObjects, revalidateStorefront, toInt, validate } from "./helpers";
import { bannerSchema, idSchema, type BannerInput } from "@/lib/validation/schemas";
import { emptyToNull } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

function toRow(v: BannerInput) {
  return {
    eyebrow: emptyToNull(v.eyebrow),
    title: v.title,
    subtitle: emptyToNull(v.subtitle),
    cta_label: emptyToNull(v.cta_label),
    cta_href: emptyToNull(v.cta_href),
    image_path: emptyToNull(v.image_path),
    display_order: toInt(v.display_order),
    is_active: v.is_active,
  };
}

export async function createBanner(input: BannerInput): Promise<ActionResult<{ id: string }>> {
  return adminAction(async ({ supabase }) => {
    const v = validate(bannerSchema, input);
    if (!v.ok) return v;
    const { data, error } = await supabase.from("homepage_banners").insert(toRow(v.data)).select("id").single();
    if (error) return dbError(error);
    revalidateStorefront();
    return { ok: true, data: { id: data.id }, message: "Banner created." };
  });
}

export async function updateBanner(id: string, input: BannerInput): Promise<ActionResult<{ id: string }>> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    const v = validate(bannerSchema, input);
    if (!v.ok) return v;
    const { data: before } = await supabase.from("homepage_banners").select("image_path").eq("id", id).maybeSingle();
    const { data, error } = await supabase.from("homepage_banners").update(toRow(v.data)).eq("id", id).select("id").maybeSingle();
    if (error) return dbError(error);
    if (!data) return fail("This banner no longer exists.");
    if (before?.image_path && before.image_path !== emptyToNull(v.data.image_path)) await removeStorageObjects(supabase, [before.image_path]);
    revalidateStorefront();
    return { ok: true, data: { id: data.id }, message: "Banner saved." };
  });
}

export async function setBannerActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    const { error, count } = await supabase.from("homepage_banners").update({ is_active: isActive }, { count: "exact" }).eq("id", id);
    if (error) return dbError(error);
    if (!count) return fail("This banner no longer exists.");
    revalidateStorefront();
    return { ok: true, data: undefined, message: isActive ? "Banner shown on homepage." : "Banner hidden." };
  });
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    const { data: before } = await supabase.from("homepage_banners").select("image_path").eq("id", id).maybeSingle();
    const { error, count } = await supabase.from("homepage_banners").delete({ count: "exact" }).eq("id", id);
    if (error) return dbError(error);
    if (!count) return fail("This banner no longer exists.");
    await removeStorageObjects(supabase, [before?.image_path]);
    revalidateStorefront();
    return { ok: true, data: undefined, message: "Banner deleted." };
  });
}
