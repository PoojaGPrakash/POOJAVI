import { test, type APIRequestContext } from "@playwright/test";
import { ADMIN, login, makeImage } from "./helpers";

/**
 * Seeds a representative catalogue and captures screenshots for visual review.
 * Opt-in: VISUAL=1 npm run test:e2e -- --grep @visual
 */
test.skip(!process.env.VISUAL, "visual screenshots are opt-in");

const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function seed(request: APIRequestContext) {
  const tok = await (await request.post(`${base}/auth/v1/token?grant_type=password`, { headers: { apikey: anon }, data: ADMIN })).json();
  const h = { apikey: anon, Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json" };
  const upload = async (folder: string, label: string, colour: string, w = 1200, hh = 1500) => {
    const img = await makeImage(label, colour, w, hh);
    const path = `${folder}/2026/11/${crypto.randomUUID()}.jpg`;
    await request.post(`${base}/storage/v1/object/media/${path}`, { headers: { ...h, "Content-Type": "image/jpeg" }, data: img.buffer });
    return path;
  };
  const existing = await (await request.get(`${base}/rest/v1/products?select=id&limit=1`, { headers: h })).json();
  if (existing.length) return;
  const cats = await (await request.get(`${base}/rest/v1/categories?select=id,slug`, { headers: h })).json();
  const cat = (s: string) => cats.find((c: { slug: string }) => c.slug === s).id;
  const palette = ["#551F32", "#7a2e3f", "#282522", "#8A6F4E", "#3f1625", "#B89D72"];
  const items = [
    ["Ivory Zari Banarasi Brocade", "banarasi"], ["Crimson Pochampally Ikat", "pochampally"], ["Champagne Raw Silk", "raw-silk"], ["Midnight Pure Silk", "pure-silk"],
    ["Rani Pink Kanjivaram Saree", "sarees"], ["Emerald Handloom Saree", "sarees"], ["Gold Tissue Saree", "sarees"], ["Ivory Chanderi Saree", "sarees"],
  ] as const;
  const ids: string[] = [];
  for (const [i, [name, slug]] of items.entries()) {
    const images = [{ storage_path: await upload("products", name.split(" ")[0]!, palette[i % 6]!), alt_text: name }];
    const r = await request.post(`${base}/rest/v1/rpc/save_product`, {
      headers: h,
      data: {
        p_id: null,
        p_data: { category_id: cat(slug), name, slug: name.toLowerCase().replace(/\s+/g, "-"), sku: `PJ-${100 + i}`, short_description: "A considered piece with a luminous finish and graceful drape.", description: "Woven with care.\n\nShared personally on enquiry.", fabric_details: "Silk. Dry clean only.", weaving_technique: "Handloom", colours: ["Ivory", "Gold"], is_featured: true, is_new_arrival: i % 2 === 0, status: "published" },
        p_images: images,
        p_collection_ids: [],
      },
    });
    ids.push((await r.json()).id);
  }
  await request.post(`${base}/rest/v1/rpc/save_collection`, { headers: h, data: { p_id: null, p_data: { name: "The Wedding Edit", slug: "the-wedding-edit", is_active: true, is_featured: true, banner_path: await upload("collections", "Wedding", "#3f1625", 1600, 2000) }, p_product_ids: ids.slice(0, 4) } });
  await request.post(`${base}/rest/v1/rpc/save_collection`, { headers: h, data: { p_id: null, p_data: { name: "Heirloom Silks", slug: "heirloom-silks", is_active: true, is_featured: true, banner_path: await upload("collections", "Heirloom", "#8A6F4E") }, p_product_ids: ids.slice(4) } });
  await request.post(`${base}/rest/v1/rpc/save_collection`, { headers: h, data: { p_id: null, p_data: { name: "Festive Edit", slug: "festive-edit", is_active: true, is_featured: true }, p_product_ids: [] } });
  await request.post(`${base}/rest/v1/homepage_banners`, { headers: h, data: { eyebrow: "The Festive Edit", title: "Silks for the season of light", subtitle: "Heirloom weaves, chosen to be treasured.", cta_label: "Explore Sarees", cta_href: "/sarees", image_path: await upload("banners", "Festive", "#551F32", 2400, 1400) } });
  for (let i = 0; i < 4; i++) await request.post(`${base}/rest/v1/instagram_posts`, { headers: h, data: { image_path: await upload("instagram", `Post ${i + 1}`, palette[i]!, 1080, 1080), caption: `Look ${i + 1}`, display_order: i } });
  await request.patch(`${base}/rest/v1/site_settings?id=eq.1`, { headers: h, data: { whatsapp_number: "+91 98450 12345", instagram_handle: "poojavithelabel", instagram_url: "https://www.instagram.com/poojavithelabel", contact_email: "hello@poojavi.test" } });
}

test("@visual capture screenshots", async ({ page, request }, info) => {
  test.setTimeout(180_000);
  await seed(request);
  // Seeding wrote straight to the API, so trigger the same revalidation an admin save does.
  await login(page, ADMIN);
  await page.waitForURL(/\/admin$/);
  await page.goto("/admin/settings");
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.getByText("Settings saved").first().waitFor();
  const dir = "visual-review";
  const shot = async (path: string, name: string, full = true) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // let hydration finish before scrolling
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${dir}/${info.project.name}-${name}.png`, fullPage: full });
  };
  await shot("/", "home");
  await shot("/fabrics", "fabrics");
  await shot("/products/ivory-zari-banarasi-brocade", "product");
  await shot("/our-story", "story");
  await shot("/contact", "contact");
  await shot("/admin", "admin-dashboard", false);
  await shot("/admin/products", "admin-products", false);
  await shot("/admin/products/new", "admin-product-form");
});
