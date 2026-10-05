import { readCatalog, writeCatalog } from "../../../../lib/catalog-storage";
import { isAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const catalog = await readCatalog();
    return Response.json(catalog, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } });
  } catch (error) {
    console.error("Admin catalog read failed:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not load catalog." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const catalog = await request.json();
    if (!catalog || !Array.isArray(catalog.collections) || !Array.isArray(catalog.products)) {
      return Response.json({ error: "Invalid catalog data." }, { status: 400 });
    }
    await writeCatalog(catalog);
    const savedCatalog = await readCatalog();
    return Response.json({ ok: true, catalog: savedCatalog }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Catalog save failed:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not save catalog." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function DELETE(request) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const type = body?.type;
    const id = body?.id;
    if (!type || !id) return Response.json({ error: "Missing item type or id." }, { status: 400 });
    if (type !== "collection" && type !== "product") return Response.json({ error: "Invalid item type." }, { status: 400 });

    const catalog = await readCatalog();
    if (type === "collection") {
      const collection = catalog.collections.find((item) => item.id === id);
      if (!collection) return Response.json({ error: "Collection not found." }, { status: 404 });
      const updatedCatalog = {
        ...catalog,
        collections: catalog.collections.filter((item) => item.id !== id),
        products: catalog.products.filter((product) => product.collection !== collection.slug),
      };
      await writeCatalog(updatedCatalog);
      return Response.json({ ok: true, catalog: await readCatalog() }, { headers: { "Cache-Control": "no-store" } });
    }

    if (!catalog.products.some((item) => item.id === id)) return Response.json({ error: "Product not found." }, { status: 404 });
    const updatedCatalog = { ...catalog, products: catalog.products.filter((item) => item.id !== id) };
    await writeCatalog(updatedCatalog);
    return Response.json({ ok: true, catalog: await readCatalog() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Catalog delete failed:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not delete item." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
