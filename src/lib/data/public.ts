import "server-only";
import { brand } from "@/lib/brand";
import { cache } from "react";
import { getPublicSupabase } from "@/lib/supabase/public";
import { env } from "@/lib/env";
import type { CategoryRow, CollectionRow, HomepageBannerRow, InstagramPostRow, SiteSettingsRow } from "@/lib/database.types";
import type { ProductWithRelations, SiteSettings } from "@/lib/types";

/*
 * Storefront data access. Uses the anonymous client, so Row Level Security
 * guarantees only published products / active categories & collections are
 * ever returned — even if a filter here were wrong.
 */

export const PRODUCT_SELECT =
  "*, category:categories!inner(id, name, slug, department), images:product_images(id, storage_path, alt_text, display_order)" as const;

type ProductQueryRow = Omit<ProductWithRelations, "images" | "category"> & {
  category: ProductWithRelations["category"];
  images: ProductWithRelations["images"] | null;
};

function toProduct(row: ProductQueryRow): ProductWithRelations {
  return {
    ...row,
    images: [...(row.images ?? [])].sort((a, b) => a.display_order - b.display_order),
  };
}

function logError(scope: string, error: unknown): void {
  console.error(`[data:${scope}]`, error instanceof Error ? error.message : error);
}

// ─── Site settings ─────────────────────────────────────────────────────
const EMPTY_SETTINGS: SiteSettingsRow = {
  id: 1,
  announcement_text: null,
  announcement_enabled: false,
  intro_eyebrow: null,
  intro_heading: null,
  intro_body: null,
  story_heading: null,
  story_body: null,
  story_image_path: null,
  craft_heading: null,
  craft_body: null,
  craft_image_path: null,
  whatsapp_number: null,
  whatsapp_default_message: null,
  instagram_handle: null,
  instagram_url: null,
  contact_email: null,
  contact_phone: null,
  contact_address: null,
  business_hours: null,
  footer_about: null,
  privacy_policy: null,
  terms_conditions: null,
  shipping_policy: null,
  returns_policy: null,
  seo_title: null,
  seo_description: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = getPublicSupabase();
  let row: SiteSettingsRow | null = null;
  if (supabase) {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) logError("site_settings", error);
    row = data;
  }
  const settings = row ?? EMPTY_SETTINGS;
  return {
    ...settings,
    // Environment fallbacks apply only until values are saved in the admin.
    whatsapp_number: settings.whatsapp_number || env.fallbackWhatsAppNumber || brand.whatsappNumber,
    contact_email: settings.contact_email || env.fallbackContactEmail || null,
  };
});

// ─── Banners & Instagram ───────────────────────────────────────────────
export async function getActiveBanners(): Promise<HomepageBannerRow[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("homepage_banners")
    .select("*")
    .eq("is_active", true)
    .order("display_order")
    .order("created_at");
  if (error) logError("banners", error);
  return data ?? [];
}

export async function getInstagramPosts(limit = 8): Promise<InstagramPostRow[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("instagram_posts")
    .select("*")
    .eq("is_active", true)
    .order("display_order")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) logError("instagram", error);
  return data ?? [];
}

// ─── Categories ────────────────────────────────────────────────────────
export async function getCategories(department?: CategoryRow["department"]): Promise<CategoryRow[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  let query = supabase.from("categories").select("*").eq("is_active", true);
  if (department) query = query.eq("department", department);
  const { data, error } = await query.order("display_order").order("name");
  if (error) logError("categories", error);
  return data ?? [];
}

export const getCategoryBySlug = cache(async (slug: string): Promise<CategoryRow | null> => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) logError("category", error);
  return data;
});

// ─── Products ──────────────────────────────────────────────────────────
export type ProductFilter = {
  department?: CategoryRow["department"];
  categoryId?: string;
  featured?: boolean;
  newArrival?: boolean;
  excludeId?: string;
  limit?: number;
};

export async function getProducts(filter: ProductFilter = {}): Promise<ProductWithRelations[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("status", "published");
  if (filter.department) query = query.eq("category.department", filter.department);
  if (filter.categoryId) query = query.eq("category_id", filter.categoryId);
  if (filter.featured) query = query.eq("is_featured", true);
  if (filter.newArrival) query = query.eq("is_new_arrival", true);
  if (filter.excludeId) query = query.neq("id", filter.excludeId);
  query = query.order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  if (filter.limit) query = query.limit(filter.limit);
  const { data, error } = await query.overrideTypes<ProductQueryRow[], { merge: false }>();
  if (error) logError("products", error);
  return (data ?? []).map(toProduct);
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductWithRelations | null> => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()
    .overrideTypes<ProductQueryRow | null, { merge: false }>();
  if (error) logError("product", error);
  return data ? toProduct(data) : null;
});

export async function getRelatedProducts(product: ProductWithRelations, limit = 4): Promise<ProductWithRelations[]> {
  const sameCategory = await getProducts({ categoryId: product.category_id, excludeId: product.id, limit });
  if (sameCategory.length >= limit || !product.category) return sameCategory;
  const more = await getProducts({ department: product.category.department, excludeId: product.id, limit: limit * 2 });
  const seen = new Set(sameCategory.map((p) => p.id));
  return [...sameCategory, ...more.filter((p) => !seen.has(p.id))].slice(0, limit);
}

export async function searchProducts(term: string): Promise<ProductWithRelations[]> {
  const supabase = getPublicSupabase();
  const q = term.trim().slice(0, 80);
  if (!supabase || q.length < 2) return [];
  const { data: hits, error } = await supabase.rpc("search_products", { search_term: q, max_results: 48 });
  if (error) {
    logError("search", error);
    return [];
  }
  const ids = (hits ?? []).map((h) => h.id);
  if (!ids.length) return [];
  const { data, error: relError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .overrideTypes<ProductQueryRow[], { merge: false }>();
  if (relError) logError("search:relations", relError);
  const byId = new Map((data ?? []).map((row) => [row.id, toProduct(row)]));
  return ids.map((id) => byId.get(id)).filter((p): p is ProductWithRelations => Boolean(p));
}

// ─── Collections ───────────────────────────────────────────────────────
export async function getCollections(options: { featuredOnly?: boolean } = {}): Promise<CollectionRow[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  let query = supabase.from("collections").select("*").eq("is_active", true);
  if (options.featuredOnly) query = query.eq("is_featured", true);
  const { data, error } = await query.order("display_order").order("name");
  if (error) logError("collections", error);
  return data ?? [];
}

export const getCollectionBySlug = cache(async (slug: string): Promise<CollectionRow | null> => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("collections").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) logError("collection", error);
  return data;
});

export async function getCollectionProducts(collectionId: string): Promise<ProductWithRelations[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data: links, error } = await supabase
    .from("collection_products")
    .select("product_id, display_order")
    .eq("collection_id", collectionId)
    .order("display_order");
  if (error) logError("collection_products", error);
  const ids = (links ?? []).map((l) => l.product_id);
  if (!ids.length) return [];
  const { data, error: pErr } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .eq("status", "published")
    .overrideTypes<ProductQueryRow[], { merge: false }>();
  if (pErr) logError("collection:products", pErr);
  const byId = new Map((data ?? []).map((row) => [row.id, toProduct(row)]));
  return ids.map((id) => byId.get(id)).filter((p): p is ProductWithRelations => Boolean(p));
}

/** Active curated collections a product belongs to (RLS hides inactive ones). */
export async function getProductCollections(productId: string): Promise<Pick<CollectionRow, "name" | "slug">[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("collection_products").select("collection:collections(name, slug)").eq("product_id", productId);
  if (error) logError("product collections", error);
  return (data ?? []).map((r) => r.collection).filter((c): c is Pick<CollectionRow, "name" | "slug"> => Boolean(c));
}

// ─── Sitemap ───────────────────────────────────────────────────────────
export async function getSitemapEntries(): Promise<{
  products: { slug: string; updated_at: string }[];
  categories: { slug: string; updated_at: string }[];
  collections: { slug: string; updated_at: string }[];
}> {
  const supabase = getPublicSupabase();
  if (!supabase) return { products: [], categories: [], collections: [] };
  const [products, categories, collections] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("status", "published").limit(5000),
    supabase.from("categories").select("slug, updated_at").eq("is_active", true),
    supabase.from("collections").select("slug, updated_at").eq("is_active", true),
  ]);
  for (const r of [products, categories, collections]) if (r.error) logError("sitemap", r.error);
  return {
    products: products.data ?? [],
    categories: categories.data ?? [],
    collections: collections.data ?? [],
  };
}
