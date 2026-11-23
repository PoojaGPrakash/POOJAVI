-- ════════════════════════════════════════════════════════════════════
--  POOJAVI THE LABEL — core schema
--  Tables, constraints, indexes, timestamps and helper functions.
--  RLS policies live in 20261123000002_rls.sql, storage in ..._storage.sql
-- ════════════════════════════════════════════════════════════════════

-- ─── Helpers ──────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Slugs: lowercase letters, digits and single hyphens.
create domain public.slug as text
  check (value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(value) between 1 and 120);

-- ─── profiles ─────────────────────────────────────────────────────────
-- One row per auth user. Role is assigned ONLY via SQL by the project owner
-- (see README → Admin setup). No client may write to this table.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- is_admin(): used by every RLS policy. SECURITY DEFINER so it can read
-- profiles regardless of the caller's own policies; it only ever returns a
-- boolean about the *current* user.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- ─── categories ───────────────────────────────────────────────────────
create table public.categories (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 120),
  slug           public.slug not null unique,
  description    text check (char_length(description) <= 2000),
  department     text not null default 'fabrics' check (department in ('fabrics', 'sarees')),
  image_path     text,
  display_order  integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index categories_active_order_idx on public.categories (is_active, display_order);
create index categories_department_idx on public.categories (department);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ─── products ─────────────────────────────────────────────────────────
create table public.products (
  id                 uuid primary key default gen_random_uuid(),
  -- RESTRICT: a category cannot be deleted while products reference it.
  category_id        uuid not null references public.categories (id) on delete restrict,
  name               text not null check (char_length(name) between 1 and 160),
  slug               public.slug not null unique,
  sku                text unique check (sku is null or sku ~ '^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$'),
  short_description  text check (char_length(short_description) <= 300),
  description        text check (char_length(description) <= 8000),
  fabric_details     text check (char_length(fabric_details) <= 4000),
  weaving_technique  text check (char_length(weaving_technique) <= 2000),
  colours            text[] not null default '{}' check (cardinality(colours) <= 30),
  is_featured        boolean not null default false,
  is_new_arrival     boolean not null default false,
  status             text not null default 'draft' check (status in ('draft', 'published')),
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status, published_at desc);
create index products_featured_idx on public.products (is_featured) where status = 'published';
create index products_new_idx on public.products (is_new_arrival) where status = 'published';
create index products_created_idx on public.products (created_at desc);

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- Keep published_at in sync with status.
create or replace function public.products_set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
  elsif new.status = 'draft' then
    new.published_at := null;
  end if;
  return new;
end;
$$;
create trigger products_published_at before insert or update of status on public.products
  for each row execute function public.products_set_published_at();

-- ─── product_images ───────────────────────────────────────────────────
create table public.product_images (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  storage_path   text not null check (char_length(storage_path) between 1 and 500),
  alt_text       text check (char_length(alt_text) <= 300),
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (product_id, storage_path)
);
create index product_images_product_idx on public.product_images (product_id, display_order);
create trigger product_images_updated_at before update on public.product_images
  for each row execute function public.set_updated_at();

-- ─── collections ──────────────────────────────────────────────────────
create table public.collections (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 120),
  slug           public.slug not null unique,
  description    text check (char_length(description) <= 2000),
  banner_path    text,
  display_order  integer not null default 0,
  is_active      boolean not null default true,
  is_featured    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index collections_active_order_idx on public.collections (is_active, display_order);
create trigger collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_products (
  collection_id  uuid not null references public.collections (id) on delete cascade,
  product_id     uuid not null references public.products (id) on delete cascade,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  primary key (collection_id, product_id)
);
create index collection_products_product_idx on public.collection_products (product_id);

-- ─── homepage_banners ─────────────────────────────────────────────────
create table public.homepage_banners (
  id             uuid primary key default gen_random_uuid(),
  eyebrow        text check (char_length(eyebrow) <= 80),
  title          text not null check (char_length(title) between 1 and 160),
  subtitle       text check (char_length(subtitle) <= 400),
  cta_label      text check (char_length(cta_label) <= 40),
  cta_href       text check (cta_href is null or cta_href ~ '^(/|https://)'),
  image_path     text,
  display_order  integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index homepage_banners_active_order_idx on public.homepage_banners (is_active, display_order);
create trigger homepage_banners_updated_at before update on public.homepage_banners
  for each row execute function public.set_updated_at();

-- ─── instagram_posts (homepage gallery) ───────────────────────────────
create table public.instagram_posts (
  id             uuid primary key default gen_random_uuid(),
  image_path     text not null,
  post_url       text check (post_url is null or post_url ~ '^https://'),
  caption        text check (char_length(caption) <= 300),
  display_order  integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index instagram_posts_active_order_idx on public.instagram_posts (is_active, display_order);
create trigger instagram_posts_updated_at before update on public.instagram_posts
  for each row execute function public.set_updated_at();

-- ─── site_settings (singleton row id = 1) ─────────────────────────────
create table public.site_settings (
  id                        smallint primary key default 1 check (id = 1),
  announcement_text         text check (char_length(announcement_text) <= 200),
  announcement_enabled      boolean not null default true,
  intro_eyebrow             text,
  intro_heading             text,
  intro_body                text,
  story_heading             text,
  story_body                text,
  story_image_path          text,
  craft_heading             text,
  craft_body                text,
  craft_image_path          text,
  whatsapp_number           text check (whatsapp_number is null or whatsapp_number ~ '^\+?[0-9 ()-]{7,20}$'),
  whatsapp_default_message  text check (char_length(whatsapp_default_message) <= 500),
  instagram_handle          text,
  instagram_url             text check (instagram_url is null or instagram_url ~ '^https://'),
  contact_email             text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone             text,
  contact_address           text,
  business_hours            text,
  footer_about              text,
  privacy_policy            text,
  terms_conditions          text,
  shipping_policy           text,
  returns_policy            text,
  seo_title                 text,
  seo_description           text check (char_length(seo_description) <= 300),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ─── contact_enquiries ────────────────────────────────────────────────
create table public.contact_enquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  phone       text check (char_length(phone) <= 30),
  subject     text check (char_length(subject) <= 160),
  message     text not null check (char_length(message) between 10 and 4000),
  product_id  uuid references public.products (id) on delete set null,
  status      text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index contact_enquiries_status_idx on public.contact_enquiries (status, created_at desc);
create index contact_enquiries_product_idx on public.contact_enquiries (product_id);
create trigger contact_enquiries_updated_at before update on public.contact_enquiries
  for each row execute function public.set_updated_at();

-- ─── Search RPC (runs with caller's rights → RLS applies) ─────────────
create or replace function public.search_products(search_term text, max_results integer default 48)
returns setof public.products
language sql
stable
security invoker
set search_path = ''
as $$
  select p.*
  from public.products p
  where char_length(trim(search_term)) >= 2
    and (
      p.name ilike '%' || trim(search_term) || '%'
      or p.sku ilike '%' || trim(search_term) || '%'
      or p.short_description ilike '%' || trim(search_term) || '%'
      or p.fabric_details ilike '%' || trim(search_term) || '%'
      or p.weaving_technique ilike '%' || trim(search_term) || '%'
      or exists (select 1 from unnest(p.colours) c where c ilike '%' || trim(search_term) || '%')
    )
  order by (p.name ilike trim(search_term) || '%') desc, p.published_at desc nulls last
  limit least(greatest(coalesce(max_results, 48), 1), 100);
$$;

-- ─── Reassign products & delete category atomically ───────────────────
-- Used by the admin dashboard when deleting a category that has products.
create or replace function public.delete_category_with_reassignment(
  target_category uuid,
  reassign_to uuid default null,
  delete_products boolean default false
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  if reassign_to is not null and delete_products then
    raise exception 'choose either reassign_to or delete_products';
  end if;
  if reassign_to = target_category then
    raise exception 'cannot reassign products to the category being deleted';
  end if;

  if reassign_to is not null then
    update public.products set category_id = reassign_to where category_id = target_category;
  elsif delete_products then
    delete from public.products where category_id = target_category;
  end if;

  -- Fails with a foreign-key violation if products still reference it.
  delete from public.categories where id = target_category;
end;
$$;
