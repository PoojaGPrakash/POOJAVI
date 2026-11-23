import { env } from "./env";

/** Public CDN URL of an object in the media bucket. */
export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (!env.supabaseUrl) return null;
  const clean = path.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  return `${env.supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${env.storageBucket}/${clean}`;
}

export const IMAGE_FOLDERS = ["products", "categories", "collections", "banners", "instagram", "site"] as const;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Unique, URL-safe object path: products/2026/11/<uuid>.jpg */
export function buildStoragePath(folder: ImageFolder, mimeType: string, now: Date = new Date(), id: string = crypto.randomUUID()): string {
  const ext = EXT[mimeType];
  if (!ext) throw new Error(`Unsupported image type: ${mimeType}`);
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${folder}/${y}/${m}/${id}.${ext}`;
}

/** Only paths inside our known folders may be deleted by admin actions. */
export function isManagedStoragePath(path: string): boolean {
  return /^(products|categories|collections|banners|instagram|site)\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(path);
}

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) return "Please upload a JPG, PNG, WebP or AVIF image.";
  if (file.size > MAX_IMAGE_BYTES) return "Images must be 10 MB or smaller.";
  if (file.size === 0) return "This file appears to be empty.";
  return null;
}
