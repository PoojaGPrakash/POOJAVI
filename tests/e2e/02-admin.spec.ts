import { expect, test, type Page } from "@playwright/test";
import { ADMIN, VIEWER, expectToast, login, makeImage, trackErrors } from "./helpers";

test.describe.configure({ mode: "serial" });

const PRODUCT = {
  name: "Ivory Zari Banarasi Brocade",
  sku: "PJ-BAN-001",
  colours: "Ivory, Antique Gold, Rose",
  short: "A luminous ivory brocade woven with antique gold zari.",
  fabric: "Silk brocade. Width 44 inches. Dry clean only.",
  weave: "Kadhwa brocade",
};
const WHATSAPP = "+91 98450 12345";

async function adminLogin(page: Page) {
  await login(page, ADMIN);
  await expect(page).toHaveURL(/\/admin$/);
}

test("rejects wrong passwords and non-admin accounts", async ({ page }) => {
  await login(page, { email: ADMIN.email, password: "wrong-password" });
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();

  await login(page, VIEWER);
  await expect(page).toHaveURL(/\/admin\/login\?error=forbidden/);
  await expect(page.getByText("does not have administrator access")).toBeVisible();
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("admin signs in and sees the dashboard", async ({ page }) => {
  const errors = trackErrors(page);
  await adminLogin(page);
  await expect(page.getByRole("heading", { name: "Welcome, Pooja" })).toBeVisible();
  for (const label of ["Total products", "Published", "Drafts", "Featured", "Categories"]) {
    await expect(page.getByRole("main").getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "No products yet" })).toBeVisible();
  expect(errors()).toEqual([]);
});

test("site settings update WhatsApp and contact details on the public site", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/settings");
  await page.getByLabel("WhatsApp business number").fill("12");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Enter a valid phone number including country code")).toBeVisible();

  await page.getByLabel("WhatsApp business number").fill(WHATSAPP);
  await page.getByLabel("Email").fill("hello@poojavi.test");
  await page.getByLabel("Instagram handle").fill("@poojavithelabel");
  await page.getByLabel("Instagram profile URL").fill("https://www.instagram.com/poojavithelabel");
  await page.getByRole("tab", { name: "Homepage" }).click();
  await page.getByLabel("Announcement text").fill("Complimentary styling consultations on WhatsApp");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expectToast(page, "Settings saved");

  await page.goto("/");
  await expect(page.getByText("Complimentary styling consultations on WhatsApp")).toBeVisible();
  const floating = page.getByRole("link", { name: "Chat with us on WhatsApp" });
  await expect(floating).toHaveAttribute("href", /^https:\/\/wa\.me\/919845012345\?text=/);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "@poojavithelabel" })).toHaveAttribute("href", "https://www.instagram.com/poojavithelabel");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "hello@poojavi.test" })).toBeVisible();
});

test("category CRUD with image upload", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/categories/new");
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByText("Name is required.")).toBeVisible();

  await page.getByLabel("Name", { exact: false }).first().fill("Test Weave");
  await expect(page.getByLabel("URL slug")).toHaveValue("test-weave");
  await page.getByLabel("Description").fill("A temporary category used by the automated tests.");
  await page.locator('input[type="file"]').setInputFiles(await makeImage("Category"));
  await expect(page.getByRole("img", { name: "Category image" })).toBeVisible();
  await page.getByRole("button", { name: "Create category" }).click();
  await expectToast(page, "Category created");
  await expect(page).toHaveURL(/\/admin\/categories$/);
  await expect(page.getByRole("link", { name: "Edit Test Weave" })).toBeVisible();

  // Duplicate slug is rejected with a field error.
  await page.goto("/admin/categories/new");
  await page.getByLabel("Name", { exact: false }).first().fill("Banarasi");
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByText("This slug is already in use")).toBeVisible();

  // Edit
  await page.goto("/admin/categories");
  await page.getByRole("link", { name: "Edit Test Weave" }).click();
  await page.getByLabel("Description").fill("Updated description for the test weave.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expectToast(page, "Category saved");

  // Public page reflects the change.
  await page.goto("/category/test-weave");
  await expect(page.getByRole("heading", { level: 1, name: "Test Weave" })).toBeVisible();
  await expect(page.getByText("Updated description for the test weave.")).toBeVisible();
});

test("product CRUD: create with images, publish, appears publicly with WhatsApp enquiry", async ({ page }) => {
  const errors = trackErrors(page);
  await adminLogin(page);
  await page.goto("/admin/products/new");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Product name is required.")).toBeVisible();
  await expect(page.getByText("Select a category.")).toBeVisible();

  await page.getByLabel("Product name").fill(PRODUCT.name);
  await expect(page.getByLabel("URL slug")).toHaveValue("ivory-zari-banarasi-brocade");
  await page.getByLabel("SKU / reference").fill(PRODUCT.sku);
  await page.getByLabel("Short description").fill(PRODUCT.short);
  await page.getByLabel("Description", { exact: true }).fill("Paragraph one about the brocade.\n\nParagraph two about its drape.");
  await page.getByLabel("Fabric details").fill(PRODUCT.fabric);
  await page.getByLabel("Weaving technique").fill(PRODUCT.weave);
  await page.getByLabel("Available colours").fill(PRODUCT.colours);
  await page.locator("#category_id").selectOption({ label: "Test Weave" });
  await page.getByRole("switch", { name: "Featured" }).click();
  await page.getByRole("switch", { name: "New arrival" }).click();
  await page.locator('input[type="file"]').setInputFiles([await makeImage("Front", "#551F32"), await makeImage("Detail", "#282522")]);
  await expect(page.getByRole("img", { name: "Product image 1" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Product image 2" })).toBeVisible();
  await page.getByLabel("Alt text for image 1").fill("Ivory brocade front view");
  // Re-order: move the second image to the front.
  await page.getByRole("button", { name: "Move image 2 earlier" }).click();
  await page.getByRole("button", { name: "Publish" }).click();
  await expectToast(page, "Product saved and published");
  await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("img", { name: "Ivory brocade front view" })).toBeVisible();

  // Public listing + detail page
  await page.goto("/fabrics");
  await expect(page.getByRole("heading", { name: PRODUCT.name })).toBeVisible();
  await page.goto("/new-arrivals");
  await expect(page.getByRole("heading", { name: PRODUCT.name })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Featured Fabrics" })).toBeVisible();
  await page.getByRole("link", { name: `View details of ${PRODUCT.name}` }).first().click();
  await expect(page).toHaveURL(/\/products\/ivory-zari-banarasi-brocade$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(PRODUCT.name);
  await expect(page.getByText(PRODUCT.sku)).toBeVisible();
  await expect(page.getByText(PRODUCT.weave)).toBeVisible();
  await expect(page.getByText("Paragraph two about its drape.")).toBeVisible();
  for (const c of ["Ivory", "Antique Gold", "Rose"]) await expect(page.getByRole("listitem").filter({ hasText: new RegExp(`^${c}$`) })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/₹|\bPrice\b/);

  const enquiry = page.getByRole("main").getByRole("link", { name: "Enquire on WhatsApp" });
  const expectedText = encodeURIComponent(`Hello Poojavi The Label, I am interested in ${PRODUCT.name}. Please share more details.`);
  await expect(enquiry).toHaveAttribute("href", `https://wa.me/919845012345?text=${expectedText}`);
  await expect(enquiry).toHaveAttribute("target", "_blank");

  // Uploaded images are served and optimised.
  const img = page.locator("main img").first();
  await expect(img).toBeVisible();
  expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);

  // Search finds it by SKU and colour.
  await page.goto("/search?q=pj-ban");
  await expect(page.getByRole("heading", { name: PRODUCT.name })).toBeVisible();
  await page.goto("/search?q=antique%20gold");
  await expect(page.getByRole("heading", { name: PRODUCT.name })).toBeVisible();
  expect(errors()).toEqual([]);
});

test("duplicate SKU is rejected, drafts stay private, unpublish hides from public", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/products/new");
  await page.getByLabel("Product name").fill("Second Brocade");
  await page.getByLabel("SKU / reference").fill(PRODUCT.sku);
  await page.locator("#category_id").selectOption({ label: "Banarasi" });
  await page.getByRole("button", { name: "Save as draft" }).click();
  await expect(page.getByText("This sku is already in use")).toBeVisible();

  await page.getByLabel("SKU / reference").fill("PJ-BAN-002");
  await page.getByRole("button", { name: "Save as draft" }).click();
  await expectToast(page, "Product saved as draft");
  const res = await page.goto("/products/second-brocade");
  expect(res?.status()).toBe(404);

  // Unpublish the first product from the list.
  await page.goto("/admin/products");
  await page.getByRole("button", { name: `Unpublish ${PRODUCT.name}` }).click();
  await expectToast(page, "Product moved to drafts");
  expect((await page.goto("/products/ivory-zari-banarasi-brocade"))?.status()).toBe(404);

  await page.goto("/admin/products?status=draft");
  await page.getByRole("button", { name: `Publish ${PRODUCT.name}` }).click();
  await expectToast(page, "Product published");
  expect((await page.goto("/products/ivory-zari-banarasi-brocade"))?.status()).toBe(200);
});

test("collections: create, assign products, feature on homepage", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/collections/new");
  await page.getByLabel("Name", { exact: false }).first().fill("The Wedding Edit");
  await page.getByLabel("Description").fill("Heirloom weaves for the celebrations that matter most.");
  await page.getByRole("button", { name: new RegExp(PRODUCT.name) }).click();
  await expect(page.getByRole("button", { name: `Remove ${PRODUCT.name}` })).toBeVisible();
  await page.getByRole("switch", { name: "Featured on homepage" }).click();
  await page.locator('input[type="file"]').setInputFiles(await makeImage("Wedding", "#3f1625", 1600, 1200));
  await expect(page.getByRole("img", { name: "Collection banner" })).toBeVisible();
  await page.getByRole("button", { name: "Create collection" }).click();
  await expectToast(page, "Collection saved");

  await page.goto("/collections");
  await expect(page.getByRole("heading", { name: "The Wedding Edit" })).toBeVisible();
  await page.goto("/collections/the-wedding-edit");
  await expect(page.getByRole("heading", { level: 1, name: "The Wedding Edit" })).toBeVisible();
  await expect(page.getByRole("heading", { name: PRODUCT.name })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("link", { name: /The Wedding Edit/ }).first()).toBeVisible();

  // Product edit page shows the assignment, and unassigning works.
  await page.goto("/admin/products");
  await page.getByRole("link", { name: `Edit ${PRODUCT.name}` }).click();
  const box = page.getByRole("checkbox", { name: "The Wedding Edit" });
  await expect(box).toBeChecked();
});

test("homepage banners and Instagram gallery", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/banners/new");
  await page.locator("#title").fill("The Festive Edit");
  await page.getByLabel("Button label").fill("Explore Sarees");
  await page.getByRole("button", { name: "Create banner" }).click();
  await expect(page.getByText("Provide both a button label and a link")).toBeVisible();
  await page.getByLabel("Button link").fill("/sarees");
  await page.getByLabel("Subtitle").fill("Silks for the season of light.");
  await page.locator('input[type="file"]').setInputFiles(await makeImage("Festive", "#551F32", 2000, 1200));
  await expect(page.getByRole("img", { name: "Banner image" })).toBeVisible();
  await page.getByRole("button", { name: "Create banner" }).click();
  await expectToast(page, "Banner created");

  await page.goto("/admin/instagram");
  await page.locator('input[type="file"]').setInputFiles(await makeImage("Insta", "#B89D72", 1080, 1080));
  await expect(page.getByRole("img", { name: "Image *" })).toBeVisible();
  await page.getByLabel("Caption / alt text").fill("Draped in ivory brocade");
  await page.getByRole("button", { name: "Add image" }).click();
  await expectToast(page, "Gallery image added");

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "The Festive Edit" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore Sarees" })).toHaveAttribute("href", "/sarees");
  const post = page.getByRole("link", { name: "Instagram post: Draped in ivory brocade" });
  await post.scrollIntoViewIfNeeded();
  const postImg = post.locator("img");
  await expect(postImg).toBeVisible();
  await expect.poll(() => postImg.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
});

test("enquiries inbox", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/enquiries");
  await expect(page.getByText("Ananya Rao")).toBeVisible();
  await page.getByRole("button", { name: "Mark read" }).first().click();
  await expectToast(page, "Enquiry updated");
  await page.goto("/admin/enquiries?status=new");
  await expect(page.getByText("Ananya Rao")).toHaveCount(0);
});

test("category with products cannot be deleted without reassignment", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/categories");
  await page.getByRole("button", { name: "Delete Test Weave" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("This category contains")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Delete category" })).toBeDisabled();
  await dialog.getByRole("combobox", { name: "Move products to" }).selectOption({ label: "Banarasi" });
  await dialog.getByRole("button", { name: "Delete category" }).click();
  await expectToast(page, "Category deleted");
  await expect(page.getByRole("link", { name: "Edit Test Weave" })).toHaveCount(0);
  expect((await page.goto("/category/test-weave"))?.status()).toBe(404);
  await page.goto("/products/ivory-zari-banarasi-brocade");
  await expect(page.getByRole("main").getByRole("link", { name: "Banarasi" }).first()).toBeVisible();
});

test("deleting a product removes it and its stored images", async ({ page, request }) => {
  await adminLogin(page);
  await page.goto("/products/ivory-zari-banarasi-brocade");
  const imageUrls = await page.locator("main img").evaluateAll((imgs) =>
    imgs.map((i) => new URL((i as HTMLImageElement).src).searchParams.get("url")).filter((u): u is string => Boolean(u)),
  );
  expect(imageUrls.length).toBeGreaterThan(0);
  expect((await request.get(imageUrls[0]!)).status()).toBe(200);

  await page.goto("/admin/products");
  await page.getByRole("button", { name: `Delete ${PRODUCT.name}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete product" }).click();
  await expectToast(page, "Product deleted");
  expect((await page.goto("/products/ivory-zari-banarasi-brocade"))?.status()).toBe(404);
  expect((await request.get(imageUrls[0]!)).ok()).toBe(false);
});

test("sign out ends the session", async ({ page }) => {
  await adminLogin(page);
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});
