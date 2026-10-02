import { list } from "@vercel/blob";
import { seedCatalog } from "../../../lib/catalog";

export const dynamic = "force-dynamic";

async function getCatalog() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return seedCatalog;
  try {
    const { blobs } = await list({ prefix: "data/catalog.json", token: process.env.BLOB_READ_WRITE_TOKEN });
    const blob = blobs?.find((b) => b.pathname === "data/catalog.json") || blobs?.[0];
    if (!blob) return seedCatalog;
    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) return seedCatalog;
    return await response.json();
  } catch {
    return seedCatalog;
  }
}

export async function GET() {
  return Response.json(await getCatalog());
}
