import { list, put } from "@vercel/blob";
import { seedCatalog } from "../../../../lib/catalog";
import { isAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

async function readCatalog() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return seedCatalog;
  try {
    const { blobs } = await list({ prefix: "data/catalog.json", token: process.env.BLOB_READ_WRITE_TOKEN });
    const blob = blobs?.find((b) => b.pathname === "data/catalog.json") || blobs?.[0];
    if (!blob) return seedCatalog;
    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) return seedCatalog;
    return await response.json();
  } catch (error) {
    console.error("Catalog read failed", error);
    return seedCatalog;
  }
}

async function writeCatalog(catalog) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  return put("data/catalog.json", JSON.stringify(catalog), {
    access: "public",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

export async function GET(request) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await readCatalog(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const catalog = await request.json();
    if (!catalog || !Array.isArray(catalog.collections) || !Array.isArray(catalog.products)) {
      return Response.json({ error: "Invalid catalog." }, { status: 400 });
    }
    await writeCatalog(catalog);
    return Response.json({ ok: true, catalog });
  } catch (error) {
    console.error("Catalog save failed", error);
    return Response.json({ error: error?.message || "Could not save catalog." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { type, id } = await request.json();
    if (!["collection", "product"].includes(type) || !id) {
      return Response.json({ error: "Type and id are required." }, { status: 400 });
    }
    const catalog = await readCatalog();
    let next = catalog;
    if (type === "product") {
      const exists = catalog.products.some((p) => p.id === id);
      if (!exists) return Response.json({ error: "Product not found." }, { status: 404 });
      next = { ...catalog, products: catalog.products.filter((p) => p.id !== id) };
    } else {
      const collection = catalog.collections.find((c) => c.id === id);
      if (!collection) return Response.json({ error: "Collection not found." }, { status: 404 });
      next = {
        collections: catalog.collections.filter((c) => c.id !== id),
        products: catalog.products.filter((p) => p.collection !== collection.slug),
      };
    }
    await writeCatalog(next);
    return Response.json({ ok: true, catalog: next });
  } catch (error) {
    console.error("Catalog delete failed", error);
    return Response.json({ error: error?.message || "Could not delete." }, { status: 500 });
  }
}
