"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { uploadImage, UploadError } from "@/lib/upload";
import { publicImageUrl, ACCEPTED_IMAGE_TYPES, type ImageFolder } from "@/lib/storage";
import { discardUpload } from "@/lib/actions/admin/media";
import { cn } from "@/lib/utils";
import { useToast } from "./Toast";

type Pending = { key: string; name: string; progress: number; previewUrl: string };

/** Tracks files uploaded during this editing session so unsaved ones can be discarded. */
function useSessionUploads() {
  const uploaded = useRef(new Set<string>());
  return {
    add: (path: string) => uploaded.current.add(path),
    discardIfNew: (path: string) => {
      if (uploaded.current.has(path)) {
        uploaded.current.delete(path);
        void discardUpload(path);
      }
    },
  };
}

function usePreviewCleanup(pending: Pending[]) {
  const urls = useRef(new Set<string>());
  useEffect(() => {
    for (const p of pending) urls.current.add(p.previewUrl);
  }, [pending]);
  useEffect(() => {
    const set = urls.current;
    return () => {
      for (const url of set) URL.revokeObjectURL(url);
    };
  }, []);
}

const accept = ACCEPTED_IMAGE_TYPES.join(",");

// ─── Single image ──────────────────────────────────────────────────────
export function SingleImageField({
  folder,
  value,
  onChange,
  label,
  hint,
  aspect = "aspect-[4/5]",
  onBusyChange,
}: {
  folder: ImageFolder;
  value: string;
  onChange: (path: string) => void;
  label: string;
  hint?: string;
  aspect?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputId = useId();
  const toast = useToast();
  const session = useSessionUploads();
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);
  usePreviewCleanup(pending ? [pending] : []);
  const url = publicImageUrl(value);

  async function handleFile(file: File | undefined) {
    if (!file || pending) return;
    setError(null);
    const item: Pending = { key: crypto.randomUUID(), name: file.name, progress: 0, previewUrl: URL.createObjectURL(file) };
    setPending(item);
    onBusyChange?.(true);
    try {
      const path = await uploadImage(file, folder, (progress) => setPending((p) => (p ? { ...p, progress } : p)));
      session.add(path);
      if (value) session.discardIfNew(value);
      onChange(path);
    } catch (err) {
      const message = err instanceof UploadError ? err.message : "Upload failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(null);
      onBusyChange?.(false);
    }
  }

  return (
    <div>
      <p className="field-label">{label}</p>
      <div className={cn("relative w-full max-w-xs overflow-hidden border border-line bg-beige/40", aspect)}>
        {pending ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={pending.previewUrl} alt="" className="h-full w-full object-cover opacity-60" />
            <Progress value={pending.progress} />
          </>
        ) : url ? (
          <Image src={url} alt={label} fill sizes="320px" className="object-cover" />
        ) : (
          <label htmlFor={inputId} className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-charcoal/50 hover:text-burgundy">
            <ImagePlus className="h-8 w-8" strokeWidth={1} />
            <span className="text-xs tracking-[0.14em] uppercase">Upload image</span>
          </label>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <label htmlFor={inputId} className={cn("btn-outline cursor-pointer !min-h-9 !px-4 !py-2", pending && "pointer-events-none opacity-60")}>
          <Upload className="h-3.5 w-3.5" /> {value ? "Replace" : "Choose image"}
        </label>
        {value && !pending && (
          <button
            type="button"
            className="btn-ghost !min-h-9 text-[#9b2c2c]"
            onClick={() => {
              session.discardIfNew(value);
              onChange("");
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={Boolean(pending)}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {hint && <p className="field-hint">{hint}</p>}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Multiple images (products) ────────────────────────────────────────
export type GalleryImage = { storage_path: string; alt_text: string };

export function MultiImageField({
  folder,
  value,
  onChange,
  max = 12,
  error,
  onBusyChange,
}: {
  folder: ImageFolder;
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  max?: number;
  error?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputId = useId();
  const toast = useToast();
  const session = useSessionUploads();
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  usePreviewCleanup(pending);

  const remaining = max - value.length - pending.length;

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, Math.max(0, remaining));
    if (!list.length) {
      if (remaining <= 0) toast.error(`You can add up to ${max} images.`);
      return;
    }
    if (files.length > list.length) toast.error(`Only ${list.length} more image(s) can be added (max ${max}).`);
    const items = list.map((file) => ({ file, item: { key: crypto.randomUUID(), name: file.name, progress: 0, previewUrl: URL.createObjectURL(file) } }));
    setPending((p) => [...p, ...items.map((i) => i.item)]);
    onBusyChange?.(true);

    // Upload sequentially to keep progress readable and avoid saturating mobile connections.
    for (const { file, item } of items) {
      try {
        const path = await uploadImage(file, folder, (progress) => setPending((p) => p.map((x) => (x.key === item.key ? { ...x, progress } : x))));
        session.add(path);
        const next = [...latest.current, { storage_path: path, alt_text: "" }];
        latest.current = next;
        onChange(next);
      } catch (err) {
        toast.error(`${file.name}: ${err instanceof UploadError ? err.message : "Upload failed."}`);
      } finally {
        setPending((p) => p.filter((x) => x.key !== item.key));
      }
    }
    onBusyChange?.(false);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    if (item) next.splice(target, 0, item);
    onChange(next);
  }

  function remove(index: number) {
    const img = value[index];
    if (img) session.discardIfNew(img.storage_path);
    onChange(value.filter((_, i) => i !== index));
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      {(value.length > 0 || pending.length > 0) && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((img, i) => {
            const url = publicImageUrl(img.storage_path);
            return (
              <li key={img.storage_path} className="border border-line bg-white">
                <div className="relative aspect-[4/5] bg-beige/40">
                  {url && <Image src={url} alt={img.alt_text || `Product image ${i + 1}`} fill sizes="200px" className="object-cover" />}
                  {i === 0 && <span className="absolute top-2 left-2 bg-burgundy px-2 py-0.5 text-[0.58rem] tracking-[0.14em] text-ivory uppercase">Cover</span>}
                </div>
                <div className="space-y-2 p-2">
                  <label className="sr-only" htmlFor={`${inputId}-alt-${i}`}>
                    Alt text for image {i + 1}
                  </label>
                  <input
                    id={`${inputId}-alt-${i}`}
                    value={img.alt_text}
                    maxLength={300}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(value.map((v, j) => (j === i ? { ...v, alt_text: e.target.value } : v)))}
                    placeholder="Alt text (describe the image)"
                    className="field-input !min-h-9 !px-2 !py-1.5 !text-xs"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`} className="p-2 text-charcoal/70 hover:text-burgundy disabled:opacity-30">
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move image ${i + 1} later`} className="p-2 text-charcoal/70 hover:text-burgundy disabled:opacity-30">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                    <button type="button" onClick={() => remove(i)} aria-label={`Remove image ${i + 1}`} className="p-2 text-[#9b2c2c] hover:text-[#701b1b]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {pending.map((p) => (
            <li key={p.key} className="border border-line bg-white">
              <div className="relative aspect-[4/5] overflow-hidden bg-beige/40">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={p.previewUrl} alt="" className="h-full w-full object-cover opacity-60" />
                <Progress value={p.progress} />
              </div>
              <p className="truncate p-2 text-xs text-charcoal/60">{p.name}</p>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-burgundy bg-burgundy/5" : "border-line bg-white hover:border-charcoal/40",
          )}
        >
          <ImagePlus className="h-8 w-8 text-charcoal/50" strokeWidth={1} />
          <span className="text-sm text-charcoal">Drop images here or click to browse</span>
          <span className="text-xs text-charcoal/50">JPG, PNG, WebP or AVIF · max 10 MB each · {remaining} remaining · first image is the cover</span>
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ivory/40">
      <Loader2 className="h-6 w-6 animate-spin text-burgundy" aria-hidden="true" />
      <div className="h-1 w-2/3 overflow-hidden bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label="Upload progress">
        <div className="h-full bg-burgundy transition-[width]" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-charcoal">{value}%</span>
    </div>
  );
}
