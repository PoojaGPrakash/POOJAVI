"use server";

import { adminAction, dbError, fail, removeStorageObjects, revalidateStorefront, toInt, validate } from "./helpers";
import { categorySchema, deleteCategorySchema, idSchema, type CategoryInput, type DeleteCategoryInput } from "@/lib/validation/schemas";
import { emptyToNull } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

const UNIQUE = { categories_slug_key: "slug" };

function toRow(v: CategoryInput) {
  return {
    name: v.name,
    slug: v.slug,
    description: emptyToNull(v.description),
    department: v.department,
    image_path: emptyToNull(v.image_path),
    display_order: toInt(v.display_order),
    is_active: v.is_active,
  };
}

export async function createCategory(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  return adminAction(async ({ supabase }) => {
    const v = validate(categorySchema, input);
    if (!v.ok) return v;
    const { data, error } = await supabase.from("categories").insert(toRow(v.data)).select("id").single();
    if (error) return dbError(error, UNIQUE);
    revalidateStorefront();
    return { ok: true, data: { id: data.id }, message: "Category created." };
  });
}

export async function updateCategory(id: string, input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    const v = validate(categorySchema, input);
    if (!v.ok) return v;
    const { data: before } = await supabase.from("categories").select("image_path").eq("id", id).maybeSingle();
    const { data, error } = await supabase.from("categories").update(toRow(v.data)).eq("id", id).select("id").maybeSingle();
    if (error) return dbError(error, UNIQUE);
    if (!data) return fail("This category no longer exists.");
    if (before?.image_path && before.image_path !== emptyToNull(v.data.image_path)) {
      await removeStorageObjects(supabase, [before.image_path]);
    }
    revalidateStorefront();
    return { ok: true, data: { id: data.id }, message: "Category saved." };
  });
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const idCheck = validate(idSchema, { id });
    if (!idCheck.ok) return idCheck;
    const { error, count } = await supabase.from("categories").update({ is_active: isActive }, { count: "exact" }).eq("id", id);
    if (error) return dbError(error);
    if (!count) return fail("This category no longer exists.");
    revalidateStorefront();
    return { ok: true, data: undefined, message: isActive ? "Category activated." : "Category deactivated." };
  });
}

/**
 * Deletes a category. If products are attached the admin must explicitly
 * choose to reassign them or delete them; otherwise deletion is refused.
 */
export async function deleteCategory(input: DeleteCategoryInput): Promise<ActionResult> {
  return adminAction(async ({ supabase }) => {
    const v = validate(deleteCategorySchema, input);
    if (!v.ok) return v;
    const { id, strategy, reassign_to } = v.data;

    const [{ data: category }, { count: productCount, error: countError }] = await Promise.all([
      supabase.from("categories").select("id, image_path").eq("id", id).maybeSingle(),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
    ]);
    if (countError) return dbError(countError);
    if (!category) return fail("This category no longer exists.");

    if ((productCount ?? 0) > 0 && strategy === "none") {
      return fail(`This category has ${productCount} product(s). Reassign or delete them before deleting the category.`);
    }

    // Collect image files of products that will be deleted, for storage cleanup.
    let productImagePaths: string[] = [];
    if (strategy === "delete_products" && productCount) {
      const { data: imgs } = await supabase.from("product_images").select("storage_path, products!inner(category_id)").eq("products.category_id", id);
      productImagePaths = (imgs ?? []).map((i) => i.storage_path);
    }

    const { error } = await supabase.rpc("delete_category_with_reassignment", {
      target_category: id,
      reassign_to: strategy === "reassign" ? reassign_to : null,
      delete_products: strategy === "delete_products",
    });
    if (error) return dbError(error);

    await removeStorageObjects(supabase, [category.image_path, ...productImagePaths]);
    revalidateStorefront();
    return { ok: true, data: undefined, message: "Category deleted." };
  });
}
