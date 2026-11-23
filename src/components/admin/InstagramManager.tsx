"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { instagramPostSchema, type InstagramPostInput } from "@/lib/validation/schemas";
import { createInstagramPost, deleteInstagramPost, updateInstagramPost } from "@/lib/actions/admin/instagram";
import type { InstagramPostRow } from "@/lib/database.types";
import { publicImageUrl } from "@/lib/storage";
import { Card, EmptyAdminState, Field, StatusBadge } from "./ui";
import { Toggle } from "./Toggle";
import { SingleImageField } from "./ImageFields";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

const empty: InstagramPostInput = { image_path: "", post_url: "", caption: "", display_order: "0", is_active: true };

export function InstagramManager({ posts }: { posts: InstagramPostRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<InstagramPostRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleting, setDeleting] = useState<InstagramPostRow | null>(null);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteInstagramPost(deleting.id);
      if (res.ok) {
        toast.success(res.message ?? "Removed.");
        if (editing?.id === deleting.id) {
          setEditing(null);
          setFormKey((k) => k + 1);
        }
        setDeleting(null);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        {posts.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {posts.map((p) => {
              const url = publicImageUrl(p.image_path);
              return (
                <li key={p.id} className="border border-line bg-white">
                  <div className="relative aspect-square bg-beige">{url && <Image src={url} alt={p.caption ?? ""} fill sizes="200px" className="object-cover" />}</div>
                  <div className="flex items-center justify-between gap-2 p-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-charcoal/70">{p.caption || "No caption"}</p>
                      <div className="mt-1 flex gap-1">
                        <StatusBadge tone="grey">#{p.display_order}</StatusBadge>
                        {!p.is_active && <StatusBadge tone="amber">Hidden</StatusBadge>}
                      </div>
                    </div>
                    <div className="flex shrink-0">
                      <button
                        type="button"
                        className="p-2 hover:text-burgundy"
                        aria-label="Edit gallery image"
                        onClick={() => {
                          setEditing(p);
                          setFormKey((k) => k + 1);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className="p-2 text-[#9b2c2c]" aria-label="Delete gallery image" onClick={() => setDeleting(p)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyAdminState title="No gallery images" description="Add images to build the Instagram gallery on the homepage." />
        )}
      </div>
      <PostForm
        key={formKey}
        post={editing}
        onDone={() => {
          setEditing(null);
          setFormKey((k) => k + 1);
          router.refresh();
        }}
        onCancel={() => {
          setEditing(null);
          setFormKey((k) => k + 1);
        }}
        createAction={createInstagramPost}
        updateAction={updateInstagramPost}
      />
      <ConfirmDialog open={Boolean(deleting)} title="Remove this image?" confirmLabel="Remove" pending={pending} onConfirm={onDelete} onCancel={() => setDeleting(null)}>
        <p>The image will be removed from the homepage gallery and deleted from storage.</p>
      </ConfirmDialog>
    </div>
  );
}

function PostForm({
  post,
  onDone,
  onCancel,
  createAction,
  updateAction,
}: {
  post: InstagramPostRow | null;
  onDone: () => void;
  onCancel: () => void;
  createAction: typeof createInstagramPost;
  updateAction: typeof updateInstagramPost;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InstagramPostInput>({
    resolver: zodResolver(instagramPostSchema),
    defaultValues: post
      ? { image_path: post.image_path, post_url: post.post_url ?? "", caption: post.caption ?? "", display_order: String(post.display_order), is_active: post.is_active }
      : empty,
  });
  const busy = pending || uploading;

  const onSubmit = handleSubmit((values) => {
    if (busy) return;
    startTransition(async () => {
      const res = post ? await updateAction(post.id, values) : await createAction(values);
      if (res.ok) {
        toast.success(res.message ?? "Saved.");
        onDone();
      } else toast.error(res.error);
    });
  });

  return (
    <Card title={post ? "Edit gallery image" : "Add gallery image"}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Controller
          control={control}
          name="image_path"
          render={({ field }) => (
            <div>
              <SingleImageField folder="instagram" label="Image *" value={field.value} onChange={field.onChange} onBusyChange={setUploading} aspect="aspect-square" />
              {errors.image_path && (
                <p role="alert" className="field-error">
                  Please upload an image.
                </p>
              )}
            </div>
          )}
        />
        <Field id="post_url" label="Instagram post link" error={errors.post_url?.message} hint="Optional — opens when the image is clicked.">
          <input id="post_url" className="field-input" placeholder="https://www.instagram.com/p/…" {...register("post_url")} />
        </Field>
        <Field id="caption" label="Caption / alt text" error={errors.caption?.message}>
          <input id="caption" className="field-input" {...register("caption")} />
        </Field>
        <Field id="ig_order" label="Display order" error={errors.display_order?.message}>
          <input id="ig_order" inputMode="numeric" className="field-input max-w-32" {...register("display_order")} />
        </Field>
        <Controller control={control} name="is_active" render={({ field }) => <Toggle id="ig_active" label="Visible" checked={field.value} onChange={field.onChange} />} />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1" disabled={busy}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {post ? "Save" : "Add image"}
          </button>
          {post && (
            <button type="button" className="btn-outline" onClick={onCancel} disabled={pending}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}
