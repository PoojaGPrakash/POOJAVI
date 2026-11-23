"use server";

import { adminAction, dbError, fail, removeStorageObjects, revalidateStorefront, toInt, validate } from "./helpers";
import { collectionSchema, idSchema, reorderSchema, type CollectionInput } from "@/lib/validation/schemas";
import type { ActionResult } from "@/lib/types";

const UNIQUE = { collections_slug_key: "slug" };

async function save(id: string | null, input: CollectionInput): Promise<ActionResult<{ id: string }>> {
  return adminAction(async ({ supabase }) => {
    if (id) {
      const idCheck = validate(idSchema, { id });
      if (!idCheck.ok) return idCheck;
    }
    const v = validate(collectionSchema, input);
    if (!v.ok) return v;
    const d = v.data;
    const before = id ? (await supabase.from("collections").select("banner_path").eq("id", id).maybeSingle()).data : null;

    const { data, error } = await supabase.rpc("save_collection", {
      p_id: id,
      p_data: {
        name: d.name,
        slug: d.slug,
        description: d.description,
        banner_path: d.banner_path,
        display_order: toInt(d.display_order),
        is_active: d.is_active,
        is_featured: d.is_featured,
      },
      p_product_ids: [...new Set(d.product_ids)],
    });
    if (error) return dbError(error, UNIQUE);
    if (!data) return fail("The collection could not be saved.");
    if (before?.banner_path && before.banner_path !== (d.banner_path || null)) await removeStorageObjects(supabase, [before.banner_path]);
    revalidateStorefront();
    return { ok: true, data: { id: data }, message: "Collection saved." };
  });
}

export async function createCollection(input: CollectionInput) {
  return save(null, input);
}

export async function updateCollection(id: string, input: CollectionInput) {
  return save(id, input);
}

export async function setCollectionActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    const { error, count } = await supabase.from("collections").update({ is_active: isActive }, { count: "exact" }).eq("id", id);
    if (error) return dbError(error);
    if (!count) return fail("This collection no longer exists.");
    revalidateStorefront();
    return { ok: true, data: undefined, message: isActive ? "Collection activated." : "Collection deactivated." };
  });
}

/** Persist a new display order (ids in the desired order). */
export async function reorderCollections(ids: string[]): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const v = validate(reorderSchema, { ids });
    if (!v.ok) return v;
    const results = await Promise.all(v.data.ids.map((cid, index) => supabase.from("collections").update({ display_order: index * 10 }).eq("id", cid)));
    const failed = results.find((r) => r.error);
    if (failed?.error) return dbError(failed.error);
    revalidateStorefront();
    return { ok: true, data: undefined, message: "Order updated." };
  });
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    const { data: before } = await supabase.from("collections").select("banner_path").eq("id", id).maybeSingle();
    const { error, count } = await supabase.from("collections").delete({ count: "exact" }).eq("id", id);
    if (error) return dbError(error);
    if (!count) return fail("This collection no longer exists.");
    await removeStorageObjects(supabase, [before?.banner_path]);
    revalidateStorefront();
    return { ok: true, data: undefined, message: "Collection deleted. Its products were not affected." };
  });
}
