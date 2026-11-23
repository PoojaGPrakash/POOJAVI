"use server";

import { adminAction, dbError, fail, removeStorageObjects, revalidateStorefront, validate } from "./helpers";
import { idSchema, productSchema, type ProductInput } from "@/lib/validation/schemas";
import { parseList } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

const UNIQUE = { products_slug_key: "slug", products_sku_key: "sku" };

async function save(id: string | null, input: ProductInput): Promise<ActionResult<{ id: string }>> {
  return adminAction(async ({ supabase }) => {
    if (id) {
      const idCheck = validate(idSchema, { id });
      if (!idCheck.ok) return idCheck;
    }
    const v = validate(productSchema, input);
    if (!v.ok) return v;
    const d = v.data;

    const { data, error } = await supabase.rpc("save_product", {
      p_id: id,
      p_data: {
        category_id: d.category_id,
        name: d.name,
        slug: d.slug,
        sku: d.sku,
        short_description: d.short_description,
        description: d.description,
        fabric_details: d.fabric_details,
        weaving_technique: d.weaving_technique,
        colours: parseList(d.colours).slice(0, 30),
        is_featured: d.is_featured,
        is_new_arrival: d.is_new_arrival,
        status: d.status,
      },
      p_images: d.images.map((img) => ({ storage_path: img.storage_path, alt_text: img.alt_text })),
      p_collection_ids: [...new Set(d.collection_ids)],
    });
    if (error) return dbError(error, UNIQUE);

    const result = data as { id?: unknown; removed_paths?: unknown } | null;
    const savedId = typeof result?.id === "string" ? result.id : null;
    if (!savedId) return fail("The product could not be saved.");
    const removed = Array.isArray(result?.removed_paths) ? result.removed_paths.filter((p): p is string => typeof p === "string") : [];
    await removeStorageObjects(supabase, removed);

    revalidateStorefront();
    const message = d.status === "published" ? "Product saved and published." : "Product saved as draft.";
    return { ok: true, data: { id: savedId }, message };
  });
}

export async function createProduct(input: ProductInput) {
  return save(null, input);
}

export async function updateProduct(id: string, input: ProductInput) {
  return save(id, input);
}

export async function setProductStatus(id: string, status: "draft" | "published"): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    if (status !== "draft" && status !== "published") return fail("Invalid status.");
    const { error, count } = await supabase.from("products").update({ status }, { count: "exact" }).eq("id", id);
    if (error) return dbError(error);
    if (!count) return fail("This product no longer exists.");
    revalidateStorefront();
    return { ok: true, data: undefined, message: status === "published" ? "Product published." : "Product moved to drafts." };
  });
}

export async function setProductFlag(id: string, flag: "is_featured" | "is_new_arrival", value: boolean): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    if (flag !== "is_featured" && flag !== "is_new_arrival") return fail("Invalid flag.");
    const patch = flag === "is_featured" ? { is_featured: value } : { is_new_arrival: value };
    const { error, count } = await supabase.from("products").update(patch, { count: "exact" }).eq("id", id);
    if (error) return dbError(error);
    if (!count) return fail("This product no longer exists.");
    revalidateStorefront();
    return { ok: true, data: undefined, message: "Product updated." };
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
    const { error, count } = await supabase.from("products").delete({ count: "exact" }).eq("id", id);
    if (error) return dbError(error);
    if (!count) return fail("This product no longer exists.");
    await removeStorageObjects(supabase, (images ?? []).map((i) => i.storage_path));
    revalidateStorefront();
    return { ok: true, data: undefined, message: "Product deleted." };
  });
}
