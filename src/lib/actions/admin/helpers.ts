import "server-only";
import { revalidatePath } from "next/cache";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { getAdminContext, type AdminContext } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";
import { isManagedStoragePath } from "@/lib/storage";
import type { ActionResult } from "@/lib/types";

type Failure = Extract<ActionResult, { ok: false }>;

export function fail(error: string, fieldErrors?: Record<string, string[] | undefined>): Failure {
  return { ok: false, error, fieldErrors };
}

/** Runs an admin-only action with uniform auth + error handling. */
export async function adminAction<T>(fn: (ctx: AdminContext) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const auth = await getAdminContext();
  if (auth.status !== "ok") {
    return fail(auth.status === "unconfigured" ? "Supabase is not configured." : "Your session has expired or you are not authorised. Please sign in again.");
  }
  try {
    return await fn(auth.ctx);
  } catch (err) {
    console.error("[admin action]", err);
    return fail("Something went wrong. Please try again.");
  }
}

export function validate<S extends z.ZodType>(schema: S, input: unknown): { ok: true; data: z.output<S> } | Failure {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fail("Please correct the highlighted fields.", fieldErrors);
}

/** Translate common Postgres errors into friendly, field-level messages. */
export function dbError(error: PostgrestError, uniqueFields: Record<string, string> = {}): Failure {
  if (error.code === "23505") {
    for (const [needle, field] of Object.entries(uniqueFields)) {
      if (error.message.includes(needle) || error.details?.includes(needle)) {
        return fail("This value is already in use.", { [field]: [`This ${field.replace(/_/g, " ")} is already in use. Choose another.`] });
      }
    }
    return fail("A record with these details already exists.");
  }
  if (error.code === "23503") return fail("This item is still referenced by other records and cannot be removed.");
  if (error.code === "23514") return fail("Some values are not allowed. Please review the form.");
  if (error.code === "42501") return fail("You are not authorised to perform this action.");
  if (error.code === "P0002" || error.code === "PGRST116") return fail("This item no longer exists. It may have been deleted.");
  console.error("[db]", error.code, error.message);
  return fail("The database could not complete this request. Please try again.");
}

/** Refresh every storefront page + sitemap after content changes. */
export function revalidateStorefront(): void {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}

/** Best-effort removal of files we manage in the media bucket. */
export async function removeStorageObjects(supabase: SupabaseClient<Database>, paths: (string | null | undefined)[]): Promise<void> {
  const safe = [...new Set(paths.filter((p): p is string => Boolean(p) && isManagedStoragePath(p!)))];
  if (!safe.length) return;
  const { error } = await supabase.storage.from(env.storageBucket).remove(safe);
  if (error) console.error("[storage] cleanup failed", error.message);
}

export function toInt(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}
