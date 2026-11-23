"use server";

import { adminAction, dbError, fail, removeStorageObjects, revalidateStorefront, toInt, validate } from "./helpers";
import { idSchema, instagramPostSchema, type InstagramPostInput } from "@/lib/validation/schemas";
import { emptyToNull } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

function toRow(v: InstagramPostInput) {
  return {
    image_path: v.image_path,
    post_url: emptyToNull(v.post_url),
    caption: emptyToNull(v.caption),
    display_order: toInt(v.display_order),
    is_active: v.is_active,
  };
}

export async function createInstagramPost(input: InstagramPostInput): Promise<ActionResult<{ id: string }>> {
  return adminAction(async ({ supabase }) => {
    const v = validate(instagramPostSchema, input);
    if (!v.ok) return v;
    const { data, error } = await supabase.from("instagram_posts").insert(toRow(v.data)).select("id").single();
    if (error) return dbError(error);
    revalidateStorefront();
    return { ok: true, data: { id: data.id }, message: "Gallery image added." };
  });
}

export async function updateInstagramPost(id: string, input: InstagramPostInput): Promise<ActionResult<{ id: string }>> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    const v = validate(instagramPostSchema, input);
    if (!v.ok) return v;
    const { data: before } = await supabase.from("instagram_posts").select("image_path").eq("id", id).maybeSingle();
    const { data, error } = await supabase.from("instagram_posts").update(toRow(v.data)).eq("id", id).select("id").maybeSingle();
    if (error) return dbError(error);
    if (!data) return fail("This gallery item no longer exists.");
    if (before?.image_path && before.image_path !== v.data.image_path) await removeStorageObjects(supabase, [before.image_path]);
    revalidateStorefront();
    return { ok: true, data: { id: data.id }, message: "Gallery image saved." };
  });
}

export async function deleteInstagramPost(id: string): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    const { data: before } = await supabase.from("instagram_posts").select("image_path").eq("id", id).maybeSingle();
    const { error, count } = await supabase.from("instagram_posts").delete({ count: "exact" }).eq("id", id);
    if (error) return dbError(error);
    if (!count) return fail("This gallery item no longer exists.");
    await removeStorageObjects(supabase, [before?.image_path]);
    revalidateStorefront();
    return { ok: true, data: undefined, message: "Gallery image removed." };
  });
}
