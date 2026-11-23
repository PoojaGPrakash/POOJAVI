"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import { buildStoragePath, validateImageFile, type ImageFolder } from "@/lib/storage";

export class UploadError extends Error {}

/**
 * Uploads an image straight from the browser to Supabase Storage with real
 * progress events (XHR). Authorised by the admin's own session — storage RLS
 * only allows admins to write to the media bucket.
 */
export async function uploadImage(file: File, folder: ImageFolder, onProgress?: (percent: number) => void, signal?: AbortSignal): Promise<string> {
  const invalid = validateImageFile(file);
  if (invalid) throw new UploadError(invalid);

  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new UploadError("Your session has expired. Please sign in again.");

  const path = buildStoragePath(folder, file.type);
  const url = `${env.supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/${env.storageBucket}/${path}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", env.supabaseAnonKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      let message = "Upload failed. Please try again.";
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        if (xhr.status === 403 || xhr.status === 401) message = "You are not authorised to upload images.";
        else if (xhr.status === 413) message = "This image is too large (max 10 MB).";
        else if (body.message) message = `Upload failed: ${body.message}`;
      } catch {
        /* keep default message */
      }
      reject(new UploadError(message));
    };
    xhr.onerror = () => reject(new UploadError("Network error during upload. Check your connection and try again."));
    xhr.onabort = () => reject(new UploadError("Upload cancelled."));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });

  return path;
}
