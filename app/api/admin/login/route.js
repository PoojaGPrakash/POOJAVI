import { cookies } from "next/headers";
import { adminToken } from "../../../../lib/admin";

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));
  if (!process.env.POOJAVI_ADMIN_PASSWORD || password !== process.env.POOJAVI_ADMIN_PASSWORD) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }
  cookies().set("poojavi_admin", adminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return Response.json({ ok: true });
}
