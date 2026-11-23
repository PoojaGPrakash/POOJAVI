import "server-only";
import type { AdminContext } from "@/lib/auth";
import type {
  CategoryRow,
  CollectionRow,
  ContactEnquiryRow,
  HomepageBannerRow,
  InstagramPostRow,
  ProductImageRow,
  ProductRow,
  SiteSettingsRow,
} from "@/lib/database.types";

type Client = AdminContext["supabase"];

function check<T>(scope: string, res: { data: T | null; error: { message: string } | null }): T | null {
  if (res.error) {
    console.error(`[admin-data:${scope}]`, res.error.message);
    throw new Error(`Could not load ${scope}. Please refresh the page.`);
  }
  return res.data;
}

export async function getDashboardStats(supabase: Client) {
  const head = { count: "exact" as const, head: true };
  const [total, published, drafts, featured, categories, collections, enquiries, recent] = await Promise.all([
    supabase.from("products").select("id", head),
    supabase.from("products").select("id", head).eq("status", "published"),
    supabase.from("products").select("id", head).eq("status", "draft"),
    supabase.from("products").select("id", head).eq("is_featured", true),
    supabase.from("categories").select("id", head),
    supabase.from("collections").select("id", head),
    supabase.from("contact_enquiries").select("id", head).eq("status", "new"),
    supabase
      .from("products")
      .select("id, name, slug, status, is_featured, is_new_arrival, created_at, category:categories(name), images:product_images(storage_path, display_order)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  for (const r of [total, published, drafts, featured, categories, collections, enquiries]) check("dashboard", { data: null, error: r.error });
  return {
    totalProducts: total.count ?? 0,
    publishedProducts: published.count ?? 0,
    draftProducts: drafts.count ?? 0,
    featuredProducts: featured.count ?? 0,
    totalCategories: categories.count ?? 0,
    totalCollections: collections.count ?? 0,
    newEnquiries: enquiries.count ?? 0,
    recent: (check("recent products", recent) ?? []).map((p) => ({
      ...p,
      images: [...(p.images ?? [])].sort((a, b) => a.display_order - b.display_order),
    })),
  };
}

export type AdminCategory = CategoryRow & { product_count: number };

export async function listCategories(supabase: Client): Promise<AdminCategory[]> {
  const res = await supabase.from("categories").select("*, products(count)").order("display_order").order("name");
  return (check("categories", res) ?? []).map(({ products, ...c }) => ({ ...c, product_count: products?.[0]?.count ?? 0 }));
}

export async function getCategory(supabase: Client, id: string): Promise<CategoryRow | null> {
  return check("category", await supabase.from("categories").select("*").eq("id", id).maybeSingle());
}

export type AdminProductListItem = Pick<ProductRow, "id" | "name" | "slug" | "sku" | "status" | "is_featured" | "is_new_arrival" | "updated_at"> & {
  category: { id: string; name: string } | null;
  images: Pick<ProductImageRow, "storage_path" | "display_order">[];
};

export type ProductListFilter = { q?: string; status?: "draft" | "published"; categoryId?: string; page?: number };
export const ADMIN_PAGE_SIZE = 24;

export async function listProducts(supabase: Client, filter: ProductListFilter) {
  const page = Math.max(1, filter.page ?? 1);
  let query = supabase
    .from("products")
    .select("id, name, slug, sku, status, is_featured, is_new_arrival, updated_at, category:categories(id, name), images:product_images(storage_path, display_order)", {
      count: "exact",
    });
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.categoryId) query = query.eq("category_id", filter.categoryId);
  if (filter.q) {
    // Strip characters with meaning in PostgREST filter syntax.
    const term = filter.q.replace(/[%,()*\\:"']/g, " ").trim().slice(0, 60);
    if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const res = await query.order("updated_at", { ascending: false }).range(from, from + ADMIN_PAGE_SIZE - 1);
  const rows = (check("products", res) ?? []).map((p) => ({ ...p, images: [...(p.images ?? [])].sort((a, b) => a.display_order - b.display_order) }));
  return { rows: rows as AdminProductListItem[], total: res.count ?? 0, page, pageCount: Math.max(1, Math.ceil((res.count ?? 0) / ADMIN_PAGE_SIZE)) };
}

export type AdminProductDetail = ProductRow & {
  images: Pick<ProductImageRow, "id" | "storage_path" | "alt_text" | "display_order">[];
  collection_ids: string[];
};

export async function getProduct(supabase: Client, id: string): Promise<AdminProductDetail | null> {
  const res = await supabase
    .from("products")
    .select("*, images:product_images(id, storage_path, alt_text, display_order), links:collection_products(collection_id)")
    .eq("id", id)
    .maybeSingle();
  const row = check("product", res);
  if (!row) return null;
  const { links, images, ...product } = row;
  return {
    ...product,
    images: [...(images ?? [])].sort((a, b) => a.display_order - b.display_order),
    collection_ids: (links ?? []).map((l) => l.collection_id),
  };
}

export async function listCategoryOptions(supabase: Client) {
  return check("category options", await supabase.from("categories").select("id, name, department, is_active").order("display_order").order("name")) ?? [];
}

export async function listCollectionOptions(supabase: Client) {
  return check("collection options", await supabase.from("collections").select("id, name, is_active").order("display_order").order("name")) ?? [];
}

export async function listProductOptions(supabase: Client) {
  const res = await supabase
    .from("products")
    .select("id, name, sku, status, category:categories(name), images:product_images(storage_path, display_order)")
    .order("name")
    .limit(1000);
  return (check("product options", res) ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    status: p.status,
    categoryName: p.category?.name ?? null,
    imagePath: [...(p.images ?? [])].sort((a, b) => a.display_order - b.display_order)[0]?.storage_path ?? null,
  }));
}

export type AdminCollection = CollectionRow & { product_count: number };

export async function listCollections(supabase: Client): Promise<AdminCollection[]> {
  const res = await supabase.from("collections").select("*, collection_products(count)").order("display_order").order("name");
  return (check("collections", res) ?? []).map(({ collection_products, ...c }) => ({ ...c, product_count: collection_products?.[0]?.count ?? 0 }));
}

export async function getCollection(supabase: Client, id: string): Promise<(CollectionRow & { product_ids: string[] }) | null> {
  const res = await supabase.from("collections").select("*, links:collection_products(product_id, display_order)").eq("id", id).maybeSingle();
  const row = check("collection", res);
  if (!row) return null;
  const { links, ...collection } = row;
  return { ...collection, product_ids: [...(links ?? [])].sort((a, b) => a.display_order - b.display_order).map((l) => l.product_id) };
}

export async function listBanners(supabase: Client): Promise<HomepageBannerRow[]> {
  return check("banners", await supabase.from("homepage_banners").select("*").order("display_order").order("created_at")) ?? [];
}

export async function getBanner(supabase: Client, id: string): Promise<HomepageBannerRow | null> {
  return check("banner", await supabase.from("homepage_banners").select("*").eq("id", id).maybeSingle());
}

export async function listInstagramPosts(supabase: Client): Promise<InstagramPostRow[]> {
  return check("instagram", await supabase.from("instagram_posts").select("*").order("display_order").order("created_at", { ascending: false })) ?? [];
}

export async function getSettings(supabase: Client): Promise<SiteSettingsRow | null> {
  return check("settings", await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle());
}

export type AdminEnquiry = ContactEnquiryRow & { product: { name: string; slug: string } | null };

export async function listEnquiries(supabase: Client, status?: ContactEnquiryRow["status"]): Promise<AdminEnquiry[]> {
  let query = supabase.from("contact_enquiries").select("*, product:products(name, slug)");
  if (status) query = query.eq("status", status);
  return (check("enquiries", await query.order("created_at", { ascending: false }).limit(200)) ?? []) as AdminEnquiry[];
}
