import { readCatalog } from "../../../lib/catalog-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const catalog = await readCatalog();
    return Response.json(catalog, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" },
    });
  } catch (error) {
    console.error("Public catalog read failed:", error);
    return Response.json({ error: "Could not load catalog." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
