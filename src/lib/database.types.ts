/**
 * Database types mirroring supabase/migrations. Same shape as the output of
 * `supabase gen types typescript` so it can be regenerated with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };
type TimestampsInsert = { created_at?: string; updated_at?: string };

export type ProfileRow = Timestamps & {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "viewer";
};

export type CategoryRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  department: "fabrics" | "sarees";
  image_path: string | null;
  display_order: number;
  is_active: boolean;
};

export type ProductRow = Timestamps & {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  fabric_details: string | null;
  weaving_technique: string | null;
  colours: string[];
  is_featured: boolean;
  is_new_arrival: boolean;
  status: "draft" | "published";
  published_at: string | null;
};

export type ProductImageRow = Timestamps & {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  display_order: number;
};

export type CollectionRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_path: string | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
};

export type CollectionProductRow = {
  collection_id: string;
  product_id: string;
  display_order: number;
  created_at: string;
};

export type HomepageBannerRow = Timestamps & {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_path: string | null;
  display_order: number;
  is_active: boolean;
};

export type InstagramPostRow = Timestamps & {
  id: string;
  image_path: string;
  post_url: string | null;
  caption: string | null;
  display_order: number;
  is_active: boolean;
};

export type SiteSettingsRow = Timestamps & {
  id: number;
  announcement_text: string | null;
  announcement_enabled: boolean;
  intro_eyebrow: string | null;
  intro_heading: string | null;
  intro_body: string | null;
  story_heading: string | null;
  story_body: string | null;
  story_image_path: string | null;
  craft_heading: string | null;
  craft_body: string | null;
  craft_image_path: string | null;
  whatsapp_number: string | null;
  whatsapp_default_message: string | null;
  instagram_handle: string | null;
  instagram_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  business_hours: string | null;
  footer_about: string | null;
  privacy_policy: string | null;
  terms_conditions: string | null;
  shipping_policy: string | null;
  returns_policy: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

export type ContactEnquiryRow = Timestamps & {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  product_id: string | null;
  status: "new" | "read" | "archived";
};

/** Insert = Row with server-generated / defaulted columns optional. */
type InsertOf<Row, Required extends keyof Row> = Pick<Row, Required> &
  Partial<Omit<Row, Required | keyof Timestamps>> &
  TimestampsInsert;

type Table<Row, Insert, Rel extends readonly unknown[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: Rel;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, InsertOf<ProfileRow, "id">>;
      categories: Table<CategoryRow, InsertOf<CategoryRow, "name" | "slug">>;
      products: Table<
        ProductRow,
        InsertOf<ProductRow, "category_id" | "name" | "slug">,
        [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ]
      >;
      product_images: Table<
        ProductImageRow,
        InsertOf<ProductImageRow, "product_id" | "storage_path">,
        [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ]
      >;
      collections: Table<CollectionRow, InsertOf<CollectionRow, "name" | "slug">>;
      collection_products: Table<
        CollectionProductRow,
        Pick<CollectionProductRow, "collection_id" | "product_id"> & { display_order?: number; created_at?: string },
        [
          {
            foreignKeyName: "collection_products_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ]
      >;
      homepage_banners: Table<HomepageBannerRow, InsertOf<HomepageBannerRow, "title">>;
      instagram_posts: Table<InstagramPostRow, InsertOf<InstagramPostRow, "image_path">>;
      site_settings: Table<SiteSettingsRow, InsertOf<SiteSettingsRow, never>>;
      contact_enquiries: Table<
        ContactEnquiryRow,
        InsertOf<ContactEnquiryRow, "name" | "email" | "message">,
        [
          {
            foreignKeyName: "contact_enquiries_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ]
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      search_products: {
        Args: { search_term: string; max_results?: number };
        Returns: ProductRow[];
        SetofOptions: { from: "*"; to: "products"; isOneToOne: false; isSetofReturn: true };
      };
      delete_category_with_reassignment: {
        Args: { target_category: string; reassign_to?: string | null; delete_products?: boolean };
        Returns: undefined;
      };
      save_product: {
        Args: { p_id: string | null; p_data: Json; p_images: Json; p_collection_ids: string[] };
        Returns: Json;
      };
      save_collection: {
        Args: { p_id: string | null; p_data: Json; p_product_ids: string[] };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
