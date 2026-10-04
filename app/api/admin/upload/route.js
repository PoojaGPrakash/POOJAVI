import { put } from "@vercel/blob";
import { isAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!isAdmin(request)) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (
      !file ||
      typeof file.arrayBuffer !== "function"
    ) {
      return Response.json(
        { error: "No image supplied." },
        { status: 400 }
      );
    }

    const safe = String(file.name || "image")
      .replace(/[^a-zA-Z0-9._-]/g, "-");

    const blob = await put(
      `uploads/${Date.now()}-${safe}`,
      file,
      {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type || "application/octet-stream",
      }
    );

    return Response.json({
      ok: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("Image upload failed:", error);

    return Response.json(
      {
        error:
          error?.message ||
          "Image upload failed.",
      },
      { status: 500 }
    );
  }
}