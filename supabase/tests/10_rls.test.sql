-- ════════════════════════════════════════════════════════════════════
--  RLS / authorisation test-suite. Run with scripts/test-db.sh
--  Every assertion raises an exception on failure (ON_ERROR_STOP=1).
-- ════════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP 1
set client_min_messages = notice;

create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

create or replace function tests.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL: %', label; end if;
  raise notice 'ok - %', label;
end $$;

-- Executes SQL and asserts it fails (permission/RLS/constraint error).
create or replace function tests.throws(stmt text, label text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'ok - % (% )', label, sqlstate;
    return;
  end;
  raise exception 'FAIL: expected error: %', label;
end $$;

-- Executes a DML statement and returns affected row count.
create or replace function tests.affected(stmt text) returns integer language plpgsql as $$
declare n integer;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $$;

grant execute on all functions in schema tests to anon, authenticated;

-- ─── Fixtures (as superuser) ──────────────────────────────────────────
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@example.com'),
  ('00000000-0000-0000-0000-0000000000b2', 'viewer@example.com');

select tests.ok((select count(*) from public.profiles) = 2, 'handle_new_user trigger created profiles');
select tests.ok((select role from public.profiles where email = 'viewer@example.com') = 'viewer', 'new users default to viewer role');

update public.profiles set role = 'admin' where email = 'admin@example.com';

insert into public.categories (id, name, slug, is_active) values
  ('11111111-0000-0000-0000-000000000001', 'Hidden Category', 'hidden-category', false);

insert into public.products (id, category_id, name, slug, sku, status) values
  ('22222222-0000-0000-0000-000000000001', (select id from public.categories where slug = 'banarasi'), 'Published Brocade', 'published-brocade', 'PJ-001', 'published'),
  ('22222222-0000-0000-0000-000000000002', (select id from public.categories where slug = 'banarasi'), 'Draft Brocade', 'draft-brocade', 'PJ-002', 'draft'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Published In Hidden', 'published-in-hidden', null, 'published');

insert into public.product_images (product_id, storage_path) values
  ('22222222-0000-0000-0000-000000000001', 'products/a.jpg'),
  ('22222222-0000-0000-0000-000000000002', 'products/b.jpg');

insert into public.collections (id, name, slug, is_active) values
  ('33333333-0000-0000-0000-000000000001', 'Wedding Edit', 'wedding-edit', true),
  ('33333333-0000-0000-0000-000000000002', 'Secret Edit', 'secret-edit', false);
insert into public.collection_products (collection_id, product_id) values
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001'),
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002');

select tests.ok((select published_at is not null from public.products where slug = 'published-brocade'), 'published_at set on publish');
select tests.ok((select published_at is null from public.products where slug = 'draft-brocade'), 'published_at null for draft');

-- Constraint checks
select tests.throws($$insert into public.categories (name, slug) values ('Bad', 'Bad Slug!')$$, 'slug domain rejects invalid slugs');
select tests.throws($$insert into public.categories (name, slug) values ('Dup', 'banarasi')$$, 'duplicate category slug rejected');
select tests.throws($$insert into public.products (category_id, name, slug, sku) values ((select id from public.categories where slug='banarasi'), 'X', 'x-unique', 'PJ-001')$$, 'duplicate SKU rejected');
select tests.ok((select tests.affected($$insert into public.products (category_id, name, slug, sku) values ((select id from public.categories where slug='banarasi'), 'No SKU A', 'no-sku-a', null), ((select id from public.categories where slug='banarasi'), 'No SKU B', 'no-sku-b', null)$$)) = 2, 'multiple products without SKU allowed');
delete from public.products where slug in ('no-sku-a', 'no-sku-b');
select tests.throws($$delete from public.categories where slug = 'banarasi'$$, 'category with products cannot be deleted (FK restrict)');
select tests.throws($$insert into public.site_settings (id) values (2)$$, 'site_settings is a singleton');

-- ════════════════════ ANONYMOUS VISITOR ════════════════════
set role anon;
reset request.jwt.claims;

select tests.ok((select count(*) from public.products) = 1, 'anon sees only published products in active categories');
select tests.ok((select count(*) from public.products where slug = 'draft-brocade') = 0, 'anon cannot see drafts');
select tests.ok((select count(*) from public.products where slug = 'published-in-hidden') = 0, 'anon cannot see products of inactive categories');
select tests.ok((select count(*) from public.categories where slug = 'hidden-category') = 0, 'anon cannot see inactive categories');
select tests.ok((select count(*) from public.product_images) = 1, 'anon sees images of visible products only');
select tests.ok((select count(*) from public.collections) = 1, 'anon sees active collections only');
select tests.ok((select count(*) from public.collection_products) = 1, 'anon sees only visible collection assignments');
select tests.ok((select count(*) from public.site_settings) = 1, 'anon can read site settings');
select tests.ok((select count(*) from public.search_products('brocade')) = 1, 'search RPC respects RLS for anon');
select tests.ok((select public.is_admin()) = false, 'anon is not admin');

select tests.throws($$select * from public.profiles$$, 'anon cannot read profiles');
select tests.throws($$select * from public.contact_enquiries$$, 'anon cannot read enquiries');
select tests.throws($$insert into public.categories (name, slug) values ('Anon', 'anon-cat')$$, 'anon cannot insert categories');
select tests.throws($$update public.products set name = 'Hacked'$$, 'anon cannot update products');
select tests.throws($$update public.site_settings set announcement_text = 'x'$$, 'anon cannot update settings');
select tests.throws($$delete from public.products$$, 'anon cannot delete products');
select tests.throws($$select public.delete_category_with_reassignment('11111111-0000-0000-0000-000000000001')$$, 'anon cannot call admin RPC');
select tests.throws($$select public.save_product(null, '{}'::jsonb, '[]'::jsonb, '{}'::uuid[])$$, 'anon cannot call save_product');

-- Contact enquiries: anon can submit, but cannot pre-set status
insert into public.contact_enquiries (name, email, message) values ('Visitor', 'visitor@example.com', 'I would love to know more about the brocade.');
select tests.throws($$insert into public.contact_enquiries (name, email, message, status) values ('Visitor', 'v@example.com', 'Hello there, valid message', 'read')$$, 'anon cannot set enquiry status');
select tests.throws($$insert into public.contact_enquiries (name, email, message) values ('V', 'not-an-email', 'short')$$, 'enquiry validation constraints enforced');

-- Storage
select tests.throws($$insert into storage.objects (bucket_id, name) values ('media', 'evil.jpg')$$, 'anon cannot upload to media bucket');

reset role;

-- ════════════════════ SIGNED-IN NON-ADMIN ════════════════════
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';

select tests.ok((select public.is_admin()) = false, 'viewer is not admin');
select tests.ok((select count(*) from public.products) = 1, 'viewer sees only published products');
select tests.ok((select count(*) from public.profiles) = 1, 'viewer sees only own profile');
select tests.ok((select count(*) from public.contact_enquiries) = 0, 'viewer cannot read enquiries');
select tests.throws($$insert into public.products (category_id, name, slug) values ((select id from public.categories where slug='banarasi'), 'Viewer', 'viewer-product')$$, 'viewer cannot insert products');
select tests.ok(tests.affected($$update public.products set name = 'Hacked'$$) = 0, 'viewer update affects nothing');
select tests.ok(tests.affected($$delete from public.categories where slug = 'sarees'$$) = 0, 'viewer delete affects nothing');
select tests.throws($$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000b2'$$, 'viewer cannot escalate own role');
select tests.throws($$insert into storage.objects (bucket_id, name) values ('media', 'evil.jpg')$$, 'viewer cannot upload to media bucket');
select tests.throws($$select public.delete_category_with_reassignment('11111111-0000-0000-0000-000000000001')$$, 'viewer cannot call admin RPC');
select tests.throws($$select public.save_product(null, '{}'::jsonb, '[]'::jsonb, '{}'::uuid[])$$, 'viewer cannot call save_product');
select tests.throws($$select public.save_collection(null, '{}'::jsonb, '{}'::uuid[])$$, 'viewer cannot call save_collection');

reset role;
reset request.jwt.claims;
select tests.ok((select role from public.profiles where email = 'viewer@example.com') = 'viewer', 'viewer role unchanged after escalation attempt');
select tests.ok((select name from public.products where slug = 'published-brocade') = 'Published Brocade', 'products unchanged after unauthorised updates');

-- ════════════════════ ADMIN ════════════════════
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

select tests.ok((select public.is_admin()) = true, 'admin is admin');
select tests.ok((select count(*) from public.products) = 3, 'admin sees drafts and hidden-category products');
select tests.ok((select count(*) from public.categories where slug = 'hidden-category') = 1, 'admin sees inactive categories');
select tests.ok((select count(*) from public.contact_enquiries) = 1, 'admin can read enquiries');
select tests.ok((select count(*) from public.profiles) = 2, 'admin can read all profiles');

insert into public.categories (id, name, slug) values ('11111111-0000-0000-0000-000000000099', 'Admin Cat', 'admin-cat');
select tests.ok(tests.affected($$update public.categories set name = 'Admin Category' where slug = 'admin-cat'$$) = 1, 'admin can update category');
insert into public.products (id, category_id, name, slug, status) values ('22222222-0000-0000-0000-000000000099', '11111111-0000-0000-0000-000000000099', 'Admin Product', 'admin-product', 'draft');
select tests.ok(tests.affected($$update public.products set status = 'published' where slug = 'admin-product'$$) = 1, 'admin can publish product');
insert into public.product_images (product_id, storage_path) values ('22222222-0000-0000-0000-000000000099', 'products/admin.jpg');
insert into public.collection_products (collection_id, product_id) values ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000099');
select tests.ok(tests.affected($$update public.site_settings set whatsapp_number = '+91 98765 43210'$$) = 1, 'admin can update settings');
select tests.ok(tests.affected($$update public.contact_enquiries set status = 'read'$$) = 1, 'admin can update enquiry status');
insert into storage.objects (bucket_id, name) values ('media', 'products/admin.jpg');
select tests.ok(true, 'admin can upload to media bucket');
select tests.throws($$insert into public.profiles (id, role) values (gen_random_uuid(), 'admin')$$, 'even admin cannot insert profiles from client');

-- Category deletion with reassignment
select tests.throws($$select public.delete_category_with_reassignment('11111111-0000-0000-0000-000000000099')$$, 'deleting category with products fails without reassignment');
select public.delete_category_with_reassignment('11111111-0000-0000-0000-000000000099', (select id from public.categories where slug = 'sarees'));
select tests.ok((select c.slug from public.products p join public.categories c on c.id = p.category_id where p.slug = 'admin-product') = 'sarees', 'products reassigned before category deletion');
select tests.ok((select count(*) from public.categories where slug = 'admin-cat') = 0, 'category deleted after reassignment');

-- Category deletion with product removal (cascades images + assignments)
insert into public.categories (id, name, slug) values ('11111111-0000-0000-0000-000000000098', 'Temp', 'temp-cat');
update public.products set category_id = '11111111-0000-0000-0000-000000000098' where slug = 'admin-product';
select public.delete_category_with_reassignment('11111111-0000-0000-0000-000000000098', null, true);
select tests.ok((select count(*) from public.products where slug = 'admin-product') = 0, 'products deleted with category');
select tests.ok((select count(*) from public.product_images where storage_path = 'products/admin.jpg') = 0, 'product images cascade on product delete');
select tests.ok((select count(*) from public.collection_products where product_id = '22222222-0000-0000-0000-000000000099') = 0, 'collection assignments cascade on product delete');

-- Atomic save_product RPC
select tests.ok(
  (select (public.save_product(null,
     jsonb_build_object('category_id', (select id from public.categories where slug='pure-silk'), 'name', 'RPC Silk', 'slug', 'rpc-silk',
       'sku', 'RPC-1', 'colours', jsonb_build_array('Ivory','Gold'), 'is_featured', true, 'is_new_arrival', false, 'status', 'published'),
     jsonb_build_array(jsonb_build_object('storage_path','products/2026/11/a.jpg','alt_text','front'), jsonb_build_object('storage_path','products/2026/11/b.jpg','alt_text','')),
     array['33333333-0000-0000-0000-000000000001']::uuid[]) ->> 'id') is not null),
  'save_product creates product');
select tests.ok((select count(*) from public.product_images pi join public.products p on p.id = pi.product_id where p.slug='rpc-silk') = 2, 'save_product stores images');
select tests.ok((select colours = array['Ivory','Gold'] from public.products where slug='rpc-silk'), 'save_product stores colours');
select tests.ok((select count(*) from public.collection_products cp join public.products p on p.id=cp.product_id where p.slug='rpc-silk') = 1, 'save_product assigns collections');
select tests.ok(
  (select public.save_product((select id from public.products where slug='rpc-silk'),
     jsonb_build_object('category_id', (select id from public.categories where slug='pure-silk'), 'name', 'RPC Silk II', 'slug', 'rpc-silk', 'sku', '', 'colours', '[]'::jsonb, 'status', 'draft'),
     jsonb_build_array(jsonb_build_object('storage_path','products/2026/11/b.jpg','alt_text','back')),
     '{}'::uuid[]) -> 'removed_paths') = '["products/2026/11/a.jpg"]'::jsonb,
  'save_product update reports removed image paths');
select tests.ok((select sku is null and status = 'draft' and published_at is null and name = 'RPC Silk II' from public.products where slug='rpc-silk'), 'save_product updates fields');
select tests.ok((select display_order = 0 and alt_text = 'back' from public.product_images where storage_path='products/2026/11/b.jpg'), 'save_product re-orders images');
select tests.ok((select count(*) from public.collection_products cp join public.products p on p.id=cp.product_id where p.slug='rpc-silk') = 0, 'save_product unassigns collections');
select tests.throws($$select public.save_product(null, jsonb_build_object('category_id', (select id from public.categories where slug='pure-silk'), 'name', 'Dup', 'slug', 'rpc-silk'), '[]'::jsonb, '{}'::uuid[])$$, 'save_product rejects duplicate slug atomically');
select tests.ok((select count(*) from public.products where name = 'Dup') = 0, 'failed save_product leaves nothing behind');

-- Atomic save_collection RPC
select tests.ok((select public.save_collection(null, jsonb_build_object('name','Festive','slug','festive','display_order','3','is_active',true,'is_featured',true),
  array[(select id from public.products where slug='rpc-silk'), '22222222-0000-0000-0000-000000000001']::uuid[]) is not null), 'save_collection creates collection');
select tests.ok((select array_agg(p.slug::text order by cp.display_order) = array['rpc-silk','published-brocade'] from public.collection_products cp join public.collections c on c.id=cp.collection_id join public.products p on p.id=cp.product_id where c.slug='festive'), 'save_collection stores ordered products');
select public.save_collection((select id from public.collections where slug='festive'), jsonb_build_object('name','Festive Edit','slug','festive','is_active',false), array['22222222-0000-0000-0000-000000000001']::uuid[]);
select tests.ok((select count(*) from public.collection_products cp join public.collections c on c.id=cp.collection_id where c.slug='festive') = 1, 'save_collection replaces assignments');
select tests.ok((select not is_active and name='Festive Edit' from public.collections where slug='festive'), 'save_collection updates fields');

-- Unpublishing hides from public immediately
update public.products set status = 'draft' where slug = 'published-brocade';
reset role;
reset request.jwt.claims;
set role anon;
select tests.ok((select count(*) from public.products) = 0, 'unpublished product disappears from public');
reset role;

\echo 'ALL RLS TESTS PASSED'
