import { get, put } from "@vercel/blob";
import { seedCatalog } from "./catalog";

export const CATALOG_PATH = "data/catalog.json";

function cloneSeedCatalog() {
  return JSON.parse(JSON.stringify(seedCatalog));
}

function validateCatalog(catalog) {
  return catalog && Array.isArray(catalog.collections) && Array.isArray(catalog.products);
}

export async function readCatalog() {
  try {
    const blob = await get(CATALOG_PATH, { access: "private", useCache: false });
    if (!blob) return cloneSeedCatalog();

    const text = await new Response(blob.stream).text();
    const catalog = JSON.parse(text);
    if (!validateCatalog(catalog)) throw new Error("Invalid catalog data stored in Blob.");
    return catalog;
  } catch (error) {
    if (error?.message?.toLowerCase().includes("not found") || error?.status === 404) {
      return cloneSeedCatalog();
    }
    console.error("Catalog read failed:", error);
    throw error;
  }
}

export async function writeCatalog(catalog) {
  if (!validateCatalog(catalog)) throw new Error("Invalid catalog data.");
  return await put(CATALOG_PATH, JSON.stringify(catalog, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}
