"use server";

import { adminAction, fail, removeStorageObjects } from "./helpers";
import { isManagedStoragePath } from "@/lib/storage";
import type { ActionResult } from "@/lib/types";

/**
 * Deletes a file that was uploaded during the current editing session but
 * then removed before the form was saved (so it is not referenced anywhere).
 */
export async function discardUpload(path: string): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    if (typeof path !== "string" || !isManagedStoragePath(path)) return fail("Invalid file.");
    const checks = await Promise.all([
      supabase.from("product_images").select("id", { count: "exact", head: true }).eq("storage_path", path),
      supabase.from("categories").select("id", { count: "exact", head: true }).eq("image_path", path),
      supabase.from("collections").select("id", { count: "exact", head: true }).eq("banner_path", path),
      supabase.from("homepage_banners").select("id", { count: "exact", head: true }).eq("image_path", path),
      supabase.from("instagram_posts").select("id", { count: "exact", head: true }).eq("image_path", path),
      supabase.from("site_settings").select("id", { count: "exact", head: true }).or(`story_image_path.eq.${path},craft_image_path.eq.${path}`),
    ]);
    if (checks.some((c) => c.error)) return fail("Could not verify the file. It has been kept.");
    if (checks.some((c) => (c.count ?? 0) > 0)) return { ok: true, data: undefined }; // still referenced: keep it
    await removeStorageObjects(supabase, [path]);
    return { ok: true, data: undefined };
  });
}
