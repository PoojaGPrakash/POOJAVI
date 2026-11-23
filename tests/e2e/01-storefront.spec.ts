import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, trackErrors } from "./helpers";

test.describe("Storefront (fresh catalogue)", () => {
  test("homepage renders brand, navigation and fallback hero without errors", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/Poojavi The Label/);
    await expect(page.getByRole("link", { name: "Poojavi The Label — home" }).first()).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of ["Home", "Fabrics", "Sarees", "Collections", "Our Story", "Contact"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Wear a");
    await expect(page.getByText("Textiles that carry a story")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Explore Collections" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Raw Silk/ }).first()).toBeVisible();
    // No prices anywhere on the storefront.
    await expect(page.locator("body")).not.toContainText(/₹|\bINR\b|\bPrice\b/i);
    // WhatsApp falls back to the built-in business number until one is saved in settings.
    await expect(page.getByTestId("whatsapp-link").first()).toHaveAttribute("href", /^https:\/\/wa\.me\/917204687075/);
    await expectNoHorizontalScroll(page);
    expect(errors()).toEqual([]);
  });

  test("every main navigation route responds", async ({ page }) => {
    const errors = trackErrors(page);
    for (const [path, heading] of [
      ["/fabrics", "Fabrics"],
      ["/sarees", "Sarees"],
      ["/collections", "Collections"],
      ["/new-arrivals", "New Arrivals"],
      ["/our-story", "Wear a Story"],
      ["/contact", "Contact"],
      ["/category/banarasi", "Banarasi"],
      ["/policies/no-returns-policy", "No Returns Policy"],
      ["/policies/privacy-policy", "Privacy Policy"],
      ["/policies/terms-and-conditions", "Terms & Conditions"],
      ["/policies/shipping-policy", "Shipping Policy"],
    ] as const) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    }
    await expect(page.getByText("All sales are final")).toBeHidden(); // not on this page
    await page.goto("/policies/no-returns-policy");
    await expect(page.getByText("All sales are final")).toBeVisible();
    expect(errors()).toEqual([]);
  });

  test("unknown routes and unpublished slugs return 404", async ({ page }) => {
    for (const path of ["/does-not-exist", "/products/not-a-product", "/category/not-a-category", "/collections/nope", "/policies/nope"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
    }
    await expect(page.getByRole("heading", { name: "This thread has come loose" })).toBeVisible();
  });

  test("SEO endpoints", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Sitemap:");
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml).toContain("/category/raw-silk");
    expect(xml).toContain("/policies/no-returns-policy");
    expect((await request.get("/opengraph-image")).headers()["content-type"]).toContain("image/png");
    expect((await request.get("/manifest.webmanifest")).status()).toBe(200);
    expect((await request.get("/icon.svg")).status()).toBe(200);
  });

  test("contact page sends enquiries over WhatsApp without asking for email", async ({ page, context }) => {
    const errors = trackErrors(page);
    await page.goto("/contact");
    await expect(page.getByLabel(/email/i)).toHaveCount(0);
    await page.getByLabel("Your name").fill("Ananya Rao");
    await page.getByLabel("What are you looking for?").fill("A pure silk saree in deep red.");
    const [popup] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: "Send on WhatsApp" }).click()]);
    const url = decodeURIComponent(popup.url());
    expect(url).toContain("917204687075");
    expect(url).toContain("A pure silk saree in deep red.");
    expect(url).toContain("Ananya Rao");
    await popup.close();
    expect(errors()).toEqual([]);
  });

  test("search page handles queries with no results", async ({ page }) => {
    await page.goto("/search?q=zzzz");
    await expect(page.getByRole("heading", { name: "No pieces found" })).toBeVisible();
  });

  test("admin area requires sign-in", async ({ page }) => {
    for (const path of ["/admin", "/admin/products", "/admin/settings", "/admin/products/new"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
    await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible();
    // No public registration exists.
    await expect(page.getByText(/sign up|register|create account/i)).toHaveCount(0);
  });

  test("Supabase API refuses anonymous writes (RLS)", async ({ request }) => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    const insert = await request.post(`${base}/rest/v1/categories`, { headers, data: { name: "Hack", slug: "hack" } });
    expect(insert.status()).toBe(401);
    const settings = await request.patch(`${base}/rest/v1/site_settings?id=eq.1`, { headers, data: { whatsapp_number: "+10000000000" } });
    expect([401, 403]).toContain(settings.status());
    const enquiries = await request.get(`${base}/rest/v1/contact_enquiries?select=*`, { headers });
    expect(enquiries.status()).toBe(401);
    const upload = await request.post(`${base}/storage/v1/object/media/products/2026/11/00000000-0000-4000-8000-000000000000.jpg`, {
      headers: { ...headers, "Content-Type": "image/jpeg" },
      data: Buffer.from([0xff, 0xd8, 0xff]),
    });
    expect(upload.status()).toBe(403);
  });
});
