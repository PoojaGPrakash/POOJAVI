-- ════════════════════════════════════════════════════════════════════
--  Row Level Security + least-privilege grants
--
--  Public (anon / signed-in non-admins) may READ:
--    • active categories, active collections, active banners/posts
--    • published products whose category is active (+ their images)
--    • site settings
--  Public may INSERT contact enquiries only (status forced to 'new').
--  Only admins (profiles.role = 'admin') may insert/update/delete store data.
-- ════════════════════════════════════════════════════════════════════

-- ─── Grants: start from nothing, then grant only what is needed ───────
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;

grant usage on schema public to anon, authenticated;

grant select on
  public.categories, public.products, public.product_images,
  public.collections, public.collection_products,
  public.homepage_banners, public.instagram_posts, public.site_settings
to anon, authenticated;

grant insert on public.contact_enquiries to anon, authenticated;

-- Admin writes are performed by signed-in users and gated by RLS (is_admin()).
grant insert, update, delete on
  public.categories, public.products, public.product_images,
  public.collections, public.collection_products,
  public.homepage_banners, public.instagram_posts
to authenticated;
grant update on public.site_settings to authenticated;
grant select, update, delete on public.contact_enquiries to authenticated;
grant select on public.profiles to authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.search_products(text, integer) to anon, authenticated;
grant execute on function public.delete_category_with_reassignment(uuid, uuid, boolean) to authenticated;

-- ─── Enable RLS everywhere ────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.collections         enable row level security;
alter table public.collection_products enable row level security;
alter table public.homepage_banners    enable row level security;
alter table public.instagram_posts     enable row level security;
alter table public.site_settings       enable row level security;
alter table public.contact_enquiries   enable row level security;

-- ─── profiles ─────────────────────────────────────────────────────────
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
-- No insert/update/delete policies: roles can only be changed via SQL.

-- ─── categories ───────────────────────────────────────────────────────
create policy "categories: public read active" on public.categories
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "categories: admin insert" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "categories: admin update" on public.categories
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories: admin delete" on public.categories
  for delete to authenticated using ((select public.is_admin()));

-- ─── products ─────────────────────────────────────────────────────────
create policy "products: public read published" on public.products
  for select to anon, authenticated
  using (
    (select public.is_admin())
    or (
      status = 'published'
      and exists (select 1 from public.categories c where c.id = category_id and c.is_active)
    )
  );
create policy "products: admin insert" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products: admin update" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products: admin delete" on public.products
  for delete to authenticated using ((select public.is_admin()));

-- ─── product_images ───────────────────────────────────────────────────
-- The EXISTS sub-query is itself filtered by the products policy above.
create policy "product_images: read if product visible" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "product_images: admin insert" on public.product_images
  for insert to authenticated with check ((select public.is_admin()));
create policy "product_images: admin update" on public.product_images
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "product_images: admin delete" on public.product_images
  for delete to authenticated using ((select public.is_admin()));

-- ─── collections ──────────────────────────────────────────────────────
create policy "collections: public read active" on public.collections
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "collections: admin insert" on public.collections
  for insert to authenticated with check ((select public.is_admin()));
create policy "collections: admin update" on public.collections
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "collections: admin delete" on public.collections
  for delete to authenticated using ((select public.is_admin()));

-- ─── collection_products ──────────────────────────────────────────────
create policy "collection_products: read if both visible" on public.collection_products
  for select to anon, authenticated
  using (
    exists (select 1 from public.collections c where c.id = collection_id)
    and exists (select 1 from public.products p where p.id = product_id)
  );
create policy "collection_products: admin insert" on public.collection_products
  for insert to authenticated with check ((select public.is_admin()));
create policy "collection_products: admin update" on public.collection_products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "collection_products: admin delete" on public.collection_products
  for delete to authenticated using ((select public.is_admin()));

-- ─── homepage_banners ─────────────────────────────────────────────────
create policy "homepage_banners: public read active" on public.homepage_banners
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "homepage_banners: admin insert" on public.homepage_banners
  for insert to authenticated with check ((select public.is_admin()));
create policy "homepage_banners: admin update" on public.homepage_banners
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "homepage_banners: admin delete" on public.homepage_banners
  for delete to authenticated using ((select public.is_admin()));

-- ─── instagram_posts ──────────────────────────────────────────────────
create policy "instagram_posts: public read active" on public.instagram_posts
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "instagram_posts: admin insert" on public.instagram_posts
  for insert to authenticated with check ((select public.is_admin()));
create policy "instagram_posts: admin update" on public.instagram_posts
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "instagram_posts: admin delete" on public.instagram_posts
  for delete to authenticated using ((select public.is_admin()));

-- ─── site_settings ────────────────────────────────────────────────────
create policy "site_settings: public read" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site_settings: admin update" on public.site_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
-- No insert/delete: the singleton row is created by the seed migration.

-- ─── contact_enquiries ────────────────────────────────────────────────
create policy "contact_enquiries: anyone can submit" on public.contact_enquiries
  for insert to anon, authenticated
  with check (status = 'new');
create policy "contact_enquiries: admin read" on public.contact_enquiries
  for select to authenticated using ((select public.is_admin()));
create policy "contact_enquiries: admin update" on public.contact_enquiries
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "contact_enquiries: admin delete" on public.contact_enquiries
  for delete to authenticated using ((select public.is_admin()));
