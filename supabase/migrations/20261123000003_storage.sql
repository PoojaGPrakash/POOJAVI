-- ════════════════════════════════════════════════════════════════════
--  Storage: public-read "media" bucket, admin-only writes
-- ════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket: files are served via the public CDN URL without a policy.
-- Writes are restricted to administrators.
create policy "media: admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

-- Admins may list objects (used to verify uploads); the public CDN URL does
-- not require a select policy.
create policy "media: admin select" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
