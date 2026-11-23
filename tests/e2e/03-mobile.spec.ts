import { expect, test } from "@playwright/test";
import { ADMIN, expectNoHorizontalScroll, login, trackErrors } from "./helpers";

test("mobile storefront: no horizontal scroll and working menu", async ({ page }) => {
  const errors = trackErrors(page);
  for (const path of ["/", "/fabrics", "/sarees", "/collections", "/our-story", "/contact", "/category/banarasi", "/policies/privacy-policy"]) {
    await page.goto(path);
    await expectNoHorizontalScroll(page);
  }
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
  await page.getByRole("button", { name: "Open menu" }).click();
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "Sarees" }).click();
  await expect(page).toHaveURL(/\/sarees$/);
  await expect(page.getByRole("heading", { level: 1, name: "Sarees" })).toBeVisible();

  await page.getByRole("button", { name: "Search" }).click();
  await page.getByLabel("Search fabrics and sarees").fill("silk");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=silk/);
  expect(errors()).toEqual([]);
});

test("mobile touch targets meet 44px minimum on key controls", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Open menu", "Search"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }
});

test("mobile admin: sign in, drawer navigation, no horizontal scroll", async ({ page }) => {
  await login(page, ADMIN);
  await expect(page).toHaveURL(/\/admin$/);
  await expectNoHorizontalScroll(page);
  await page.getByRole("button", { name: "Open admin menu" }).click();
  await page.getByRole("dialog", { name: "Admin menu" }).getByRole("link", { name: "Products", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  for (const path of ["/admin/products/new", "/admin/categories", "/admin/settings", "/admin/collections/new"]) {
    await page.goto(path);
    await expectNoHorizontalScroll(page);
  }
});
