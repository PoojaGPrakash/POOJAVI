import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only the admin area needs session handling; the storefront is public and
  // statically cached, so we keep the proxy off those routes for speed.
  matcher: ["/admin", "/admin/:path*"],
};
