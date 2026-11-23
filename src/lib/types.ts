import type { CategoryRow, CollectionRow, ProductImageRow, ProductRow, SiteSettingsRow } from "./database.types";

export type ProductImage = Pick<ProductImageRow, "id" | "storage_path" | "alt_text" | "display_order">;
export type CategorySummary = Pick<CategoryRow, "id" | "name" | "slug" | "department">;

/** Product as used by cards & detail pages. */
export type ProductWithRelations = ProductRow & {
  category: CategorySummary | null;
  images: ProductImage[];
};

export type CollectionWithCount = CollectionRow & { product_count: number };

export type SiteSettings = SiteSettingsRow;

/** Uniform result type for every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
