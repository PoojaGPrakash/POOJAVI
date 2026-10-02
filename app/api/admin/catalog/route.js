import { list, put } from "@vercel/blob";
import { seedCatalog } from "../../../../lib/catalog";
import { isAdmin } from "../../../../lib/admin";

async function readCatalog() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return seedCatalog;
  const { blobs } = await list({ prefix: "data/catalog.json", token: process.env.BLOB_READ_WRITE_TOKEN });
  const blob = blobs?.find((b) => b.pathname === "data/catalog.json") || blobs?.[0];
  if (!blob) return seedCatalog;
  const response = await fetch(blob.url, { cache: "no-store" });
  return response.ok ? response.json() : seedCatalog;
}

export async function GET() {
  return Response.json(await readCatalog());
}

export async function POST(request) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: "BLOB_READ_WRITE_TOKEN is not configured." }, { status: 500 });
  const catalog = await request.json();
  if (!catalog || !Array.isArray(catalog.collections) || !Array.isArray(catalog.products)) {
    return Response.json({ error: "Invalid catalog." }, { status: 400 });
  }
  const blob = await put("data/catalog.json", JSON.stringify(catalog), {
    access: "public",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: "application/json"
  });
  return Response.json({ ok: true, url: blob.url });
}
