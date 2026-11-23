import { describe, expect, it } from "vitest";
import { bannerSchema, categorySchema, contactSchema, deleteCategorySchema, productSchema, siteSettingsSchema } from "@/lib/validation/schemas";

const uuid = "3f9c2b4e-1a2b-4c3d-8e9f-0a1b2c3d4e5f";
const validProduct = {
  name: "Ivory Brocade",
  slug: "ivory-brocade",
  category_id: uuid,
  sku: "PJ-001",
  short_description: "",
  description: "",
  fabric_details: "",
  weaving_technique: "",
  colours: "Ivory, Gold",
  is_featured: false,
  is_new_arrival: true,
  status: "published" as const,
  images: [{ storage_path: `products/2026/11/${uuid}.jpg`, alt_text: "" }],
  collection_ids: [],
};

describe("productSchema", () => {
  it("accepts a valid product", () => {
    expect(productSchema.safeParse(validProduct).success).toBe(true);
  });
  it("requires name, slug and category", () => {
    const r = productSchema.safeParse({ ...validProduct, name: " ", slug: "", category_id: "" });
    expect(r.success).toBe(false);
    const fields = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["name", "slug", "category_id"]));
  });
  it("rejects bad slugs, SKUs and foreign image paths", () => {
    expect(productSchema.safeParse({ ...validProduct, slug: "Bad Slug" }).success).toBe(false);
    expect(productSchema.safeParse({ ...validProduct, sku: "has space" }).success).toBe(false);
    expect(productSchema.safeParse({ ...validProduct, images: [{ storage_path: "https://evil.example/x.jpg", alt_text: "" }] }).success).toBe(false);
  });
  it("limits images to 12", () => {
    const images = Array.from({ length: 13 }, () => ({ storage_path: `products/2026/11/${uuid}.jpg`, alt_text: "" }));
    expect(productSchema.safeParse({ ...validProduct, images }).success).toBe(false);
  });
  it("allows an empty SKU", () => {
    expect(productSchema.safeParse({ ...validProduct, sku: "" }).success).toBe(true);
  });
});

describe("categorySchema / deleteCategorySchema", () => {
  const cat = { name: "Raw Silk", slug: "raw-silk", description: "", department: "fabrics" as const, image_path: "", display_order: "10", is_active: true };
  it("validates categories", () => {
    expect(categorySchema.safeParse(cat).success).toBe(true);
    expect(categorySchema.safeParse({ ...cat, display_order: "ten" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...cat, department: "shoes" }).success).toBe(false);
  });
  it("requires a target when reassigning products", () => {
    expect(deleteCategorySchema.safeParse({ id: uuid, strategy: "reassign", reassign_to: "" }).success).toBe(false);
    expect(deleteCategorySchema.safeParse({ id: uuid, strategy: "reassign", reassign_to: uuid }).success).toBe(false);
    expect(deleteCategorySchema.safeParse({ id: uuid, strategy: "none", reassign_to: "" }).success).toBe(true);
  });
});

describe("bannerSchema", () => {
  const banner = { eyebrow: "", title: "Festive", subtitle: "", cta_label: "", cta_href: "", image_path: "", display_order: "0", is_active: true };
  it("requires both CTA label and link or neither", () => {
    expect(bannerSchema.safeParse(banner).success).toBe(true);
    expect(bannerSchema.safeParse({ ...banner, cta_label: "Shop" }).success).toBe(false);
    expect(bannerSchema.safeParse({ ...banner, cta_label: "Shop", cta_href: "/sarees" }).success).toBe(true);
  });
  it("blocks javascript: links", () => {
    expect(bannerSchema.safeParse({ ...banner, cta_label: "x", cta_href: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  const msg = { name: "Ananya", email: "a@example.com", phone: "", subject: "", message: "I would like to know more.", product_id: "", website: "" };
  it("accepts a genuine enquiry", () => {
    expect(contactSchema.safeParse(msg).success).toBe(true);
  });
  it("rejects bots that fill the honeypot", () => {
    expect(contactSchema.safeParse({ ...msg, website: "http://spam" }).success).toBe(false);
  });
  it("validates email and message length", () => {
    expect(contactSchema.safeParse({ ...msg, email: "nope" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...msg, message: "short" }).success).toBe(false);
  });
});

describe("siteSettingsSchema", () => {
  it("validates WhatsApp number and links", () => {
    const base = Object.fromEntries(Object.keys(siteSettingsSchema.shape).map((k) => [k, ""])) as Record<string, unknown>;
    base.announcement_enabled = true;
    expect(siteSettingsSchema.safeParse({ ...base, whatsapp_number: "+91 98450 12345" }).success).toBe(true);
    expect(siteSettingsSchema.safeParse({ ...base, whatsapp_number: "call me" }).success).toBe(false);
    expect(siteSettingsSchema.safeParse({ ...base, instagram_url: "http://insecure.example" }).success).toBe(false);
  });
});
