import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

function isAllowedPathname(pathname) {
  return typeof pathname === "string" && pathname.startsWith("uploads/") && !pathname.includes("..");
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get("pathname");
    if (!isAllowedPathname(pathname)) return new Response("Invalid image path.", { status: 400 });

    const blob = await get(pathname, { access: "private", useCache: false });
    if (!blob) return new Response("Image not found.", { status: 404 });

    return new Response(blob.stream, {
      status: 200,
      headers: {
        "Content-Type": blob.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Media read failed:", error);
    return new Response("Could not load image.", { status: 500 });
  }
}
