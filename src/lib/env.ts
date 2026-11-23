/**
 * Central, typed access to public configuration.
 * Only NEXT_PUBLIC_* values live here — this module is safe for the browser.
 * (The service-role key is never used by this application.)
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  storageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "media",
  fallbackWhatsAppNumber: process.env.NEXT_PUBLIC_FALLBACK_WHATSAPP_NUMBER ?? "",
  fallbackContactEmail: process.env.NEXT_PUBLIC_FALLBACK_CONTACT_EMAIL ?? "",
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
