"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

let browserClient: SupabaseClient<Database> | null = null;

/** Browser client (admin uploads, sign-in). Singleton per tab. */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  browserClient ??= createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
  return browserClient;
}
