import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { env, isSupabaseConfigured } from "@/lib/env";

const LOGIN_PATH = "/admin/login";

/**
 * Refreshes the Supabase session cookie and performs an *optimistic* check
 * that the visitor is signed in before any /admin page renders. The
 * authoritative admin-role check happens server-side in requireAdmin() and
 * in the database via RLS.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLogin = pathname === LOGIN_PATH;

  if (!isSupabaseConfigured()) {
    if (isAdminArea && !isLogin) return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    return response;
  }

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() validates the JWT with Supabase Auth (do not trust getSession()).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminArea && !isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  if (isAdminArea) response.headers.set("Cache-Control", "private, no-store");
  return response;
}
