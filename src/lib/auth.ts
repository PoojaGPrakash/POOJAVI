import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { ProfileRow } from "@/lib/database.types";

export type AdminContext = {
  user: User;
  profile: Pick<ProfileRow, "id" | "email" | "full_name" | "role">;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
};

type AdminLookup =
  | { status: "ok"; ctx: AdminContext }
  | { status: "unauthenticated" | "forbidden" | "unconfigured" };

/** Resolves the current user and verifies the admin role (cached per request). */
export const getAdminContext = cache(async (): Promise<AdminLookup> => {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unauthenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") return { status: "forbidden" };
  return { status: "ok", ctx: { user, profile, supabase } };
});

/** For admin pages/layouts: redirects anyone who is not an admin. */
export async function requireAdminPage(): Promise<AdminContext> {
  const result = await getAdminContext();
  if (result.status === "ok") return result.ctx;
  if (result.status === "forbidden") redirect("/admin/login?error=forbidden");
  redirect("/admin/login");
}

export class UnauthorisedError extends Error {
  constructor() {
    super("You are not authorised to perform this action.");
  }
}

/** For server actions: throws if the caller is not an admin. */
export async function requireAdminAction(): Promise<AdminContext> {
  const result = await getAdminContext();
  if (result.status !== "ok") throw new UnauthorisedError();
  return result.ctx;
}
