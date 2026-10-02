import { put } from "@vercel/blob";
import { isAdmin } from "../../../../lib/admin";

export async function POST(request) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: "BLOB_READ_WRITE_TOKEN is not configured." }, { status: 500 });
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") return Response.json({ error: "No image supplied." }, { status: 400 });
  const safe = String(file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "-");
  const blob = await put(`uploads/${Date.now()}-${safe}`, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
  return Response.json({ url: blob.url });
}
