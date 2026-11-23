import { expect, type Page } from "@playwright/test";
import sharp from "sharp";

export const ADMIN = { email: "admin@poojavi.test", password: "Admin#Pass123" };
export const VIEWER = { email: "viewer@poojavi.test", password: "Viewer#Pass123" };

/** Generates a woven-pattern JPEG in memory for upload tests. */
export async function makeImage(label: string, colour = "#551F32", width = 1200, height = 1500): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><pattern id="p" width="80" height="96" patternUnits="userSpaceOnUse">
      <path d="M40 6 L74 48 L40 90 L6 48 Z" fill="none" stroke="#D6C2A1" stroke-width="3"/></pattern></defs>
    <rect width="100%" height="100%" fill="${colour}"/><rect width="100%" height="100%" fill="url(#p)"/>
    <text x="50%" y="52%" font-size="72" text-anchor="middle" fill="#F8F5EF" font-family="serif">${label}</text></svg>`;
  const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer();
  return { name: `${label.replace(/\W+/g, "-").toLowerCase()}.jpg`, mimeType: "image/jpeg", buffer };
}

/** Collects console errors and uncaught exceptions for a page. */
export function trackErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return () => errors;
}

export async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password", { exact: true }).fill(creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.getByRole("status").filter({ hasText: text }).first()).toBeVisible();
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(0);
}
