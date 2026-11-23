import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { env, isSupabaseConfigured } from "@/lib/env";

let client: SupabaseClient<Database> | null = null;

/**
 * Cookie-less anonymous client for public storefront reads. Not tied to a
 * request, so storefront pages can be statically generated and revalidated.
 * Returns null when Supabase has not been configured yet.
 */
export function getPublicSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null;
  client ??= createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
