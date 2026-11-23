import { z } from "zod";

/*
 * Shared Zod schemas — used by React Hook Form on the client AND re-validated
 * inside every server action. Inputs are plain strings/booleans so the form
 * input type equals the output type (no coercion surprises).
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/;
const STORAGE_PATH_RE = /^(products|categories|collections|banners|instagram|site)\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;

const id = z.guid({ message: "Invalid identifier." });
const slug = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(120, "Slug must be 120 characters or fewer.")
  .regex(SLUG_RE, "Use lowercase letters, numbers and single hyphens only.");
const optionalText = (max: number, label = "This field") =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);
const storagePath = z.string().regex(STORAGE_PATH_RE, "Invalid image reference.");
const optionalStoragePath = z.union([storagePath, z.literal("")]);
const displayOrder = z
  .string()
  .trim()
  .regex(/^-?\d{1,6}$/, "Enter a whole number.");
const internalOrHttpsHref = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://"), "Use a site path like /fabrics or a full https:// link.");
const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/[^\s]+\.[^\s]+/.test(v), "Enter a full link starting with https://");

// ─── Categories ────────────────────────────────────────────────────────
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  slug,
  description: optionalText(2000, "Description"),
  department: z.enum(["fabrics", "sarees"]),
  image_path: optionalStoragePath,
  display_order: displayOrder,
  is_active: z.boolean(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const deleteCategorySchema = z
  .object({
    id,
    strategy: z.enum(["none", "reassign", "delete_products"]),
    reassign_to: z.union([id, z.literal("")]),
  })
  .refine((v) => v.strategy !== "reassign" || v.reassign_to !== "", {
    message: "Choose a category to move the products to.",
    path: ["reassign_to"],
  })
  .refine((v) => v.strategy !== "reassign" || v.reassign_to !== v.id, {
    message: "Choose a different category.",
    path: ["reassign_to"],
  });
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;

// ─── Products ──────────────────────────────────────────────────────────
export const productImageSchema = z.object({
  storage_path: storagePath,
  alt_text: optionalText(300, "Alt text"),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(160),
  slug,
  category_id: z.string().min(1, "Select a category.").pipe(id),
  sku: z
    .string()
    .trim()
    .max(64)
    .refine((v) => v === "" || SKU_RE.test(v), "Use letters, numbers, dots, slashes or hyphens."),
  short_description: optionalText(300, "Short description"),
  description: optionalText(8000, "Description"),
  fabric_details: optionalText(4000, "Fabric details"),
  weaving_technique: optionalText(2000, "Weaving technique"),
  colours: optionalText(1000, "Colours"),
  is_featured: z.boolean(),
  is_new_arrival: z.boolean(),
  status: z.enum(["draft", "published"]),
  images: z.array(productImageSchema).max(12, "A product can have up to 12 images."),
  collection_ids: z.array(id).max(50),
});
export type ProductInput = z.infer<typeof productSchema>;

// ─── Collections ───────────────────────────────────────────────────────
export const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  slug,
  description: optionalText(2000, "Description"),
  banner_path: optionalStoragePath,
  display_order: displayOrder,
  is_active: z.boolean(),
  is_featured: z.boolean(),
  product_ids: z.array(id).max(500),
});
export type CollectionInput = z.infer<typeof collectionSchema>;

// ─── Homepage banners ──────────────────────────────────────────────────
export const bannerSchema = z
  .object({
    eyebrow: optionalText(80, "Eyebrow"),
    title: z.string().trim().min(1, "Title is required.").max(160),
    subtitle: optionalText(400, "Subtitle"),
    cta_label: optionalText(40, "Button label"),
    cta_href: internalOrHttpsHref,
    image_path: optionalStoragePath,
    display_order: displayOrder,
    is_active: z.boolean(),
  })
  .refine((v) => (v.cta_label === "") === (v.cta_href === ""), {
    message: "Provide both a button label and a link, or leave both empty.",
    path: ["cta_href"],
  });
export type BannerInput = z.infer<typeof bannerSchema>;

// ─── Instagram posts ───────────────────────────────────────────────────
export const instagramPostSchema = z.object({
  image_path: storagePath,
  post_url: httpsUrl,
  caption: optionalText(300, "Caption"),
  display_order: displayOrder,
  is_active: z.boolean(),
});
export type InstagramPostInput = z.infer<typeof instagramPostSchema>;

// ─── Site settings ─────────────────────────────────────────────────────
const phone = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\+?[0-9 ()-]{7,20}$/.test(v), "Enter a valid phone number including country code, e.g. +91 98765 43210.");
const email = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Enter a valid email address.");

export const siteSettingsSchema = z.object({
  announcement_text: optionalText(200, "Announcement"),
  announcement_enabled: z.boolean(),
  intro_eyebrow: optionalText(80),
  intro_heading: optionalText(200),
  intro_body: optionalText(3000),
  story_heading: optionalText(200),
  story_body: optionalText(10000),
  story_image_path: optionalStoragePath,
  craft_heading: optionalText(200),
  craft_body: optionalText(6000),
  craft_image_path: optionalStoragePath,
  whatsapp_number: phone,
  whatsapp_default_message: optionalText(500),
  instagram_handle: z
    .string()
    .trim()
    .max(60)
    .refine((v) => v === "" || /^@?[A-Za-z0-9._]{1,30}$/.test(v), "Enter a valid Instagram handle."),
  instagram_url: httpsUrl,
  contact_email: email,
  contact_phone: phone,
  contact_address: optionalText(500),
  business_hours: optionalText(200),
  footer_about: optionalText(500),
  privacy_policy: optionalText(20000),
  terms_conditions: optionalText(20000),
  shipping_policy: optionalText(20000),
  returns_policy: optionalText(20000),
  seo_title: optionalText(120),
  seo_description: optionalText(300),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

// ─── Public contact form ───────────────────────────────────────────────
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().min(1, "Please enter your email.").max(200).regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || /^\+?[0-9 ()-]{7,20}$/.test(v), "Please enter a valid phone number."),
  subject: optionalText(160, "Subject"),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(4000, "Please keep your message under 4000 characters."),
  product_id: z.union([id, z.literal("")]),
  // Honeypot — real visitors never see or fill this field.
  website: z.string().max(0, "Invalid submission."),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ─── Admin login ───────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const enquiryStatusSchema = z.object({ id, status: z.enum(["new", "read", "archived"]) });
export const idSchema = z.object({ id });
export const reorderSchema = z.object({ ids: z.array(id).min(1).max(500) });
