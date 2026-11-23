-- ════════════════════════════════════════════════════════════════════
--  Atomic admin write operations.
--  SECURITY INVOKER: RLS still applies, plus an explicit is_admin() guard.
--  Each function runs in a single transaction, so a product (or collection)
--  is never left half-saved.
-- ════════════════════════════════════════════════════════════════════

create or replace function public.save_product(
  p_id uuid,
  p_data jsonb,
  p_images jsonb,
  p_collection_ids uuid[]
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_removed text[];
  v_colours text[];
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  if jsonb_typeof(coalesce(p_images, '[]'::jsonb)) <> 'array' then
    raise exception 'p_images must be an array';
  end if;

  v_colours := coalesce(array(select jsonb_array_elements_text(coalesce(p_data -> 'colours', '[]'::jsonb))), '{}');

  if p_id is null then
    insert into public.products (
      category_id, name, slug, sku, short_description, description, fabric_details,
      weaving_technique, colours, is_featured, is_new_arrival, status
    ) values (
      (p_data ->> 'category_id')::uuid,
      p_data ->> 'name',
      p_data ->> 'slug',
      nullif(p_data ->> 'sku', ''),
      nullif(p_data ->> 'short_description', ''),
      nullif(p_data ->> 'description', ''),
      nullif(p_data ->> 'fabric_details', ''),
      nullif(p_data ->> 'weaving_technique', ''),
      v_colours,
      coalesce((p_data ->> 'is_featured')::boolean, false),
      coalesce((p_data ->> 'is_new_arrival')::boolean, false),
      coalesce(p_data ->> 'status', 'draft')
    )
    returning id into v_id;
  else
    update public.products set
      category_id       = (p_data ->> 'category_id')::uuid,
      name              = p_data ->> 'name',
      slug              = p_data ->> 'slug',
      sku               = nullif(p_data ->> 'sku', ''),
      short_description = nullif(p_data ->> 'short_description', ''),
      description       = nullif(p_data ->> 'description', ''),
      fabric_details    = nullif(p_data ->> 'fabric_details', ''),
      weaving_technique = nullif(p_data ->> 'weaving_technique', ''),
      colours           = v_colours,
      is_featured       = coalesce((p_data ->> 'is_featured')::boolean, false),
      is_new_arrival    = coalesce((p_data ->> 'is_new_arrival')::boolean, false),
      status            = coalesce(p_data ->> 'status', 'draft')
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'product not found' using errcode = 'P0002';
    end if;
  end if;

  -- Images: remove those no longer listed, upsert the rest in order.
  select coalesce(array_agg(pi.storage_path), '{}') into v_removed
  from public.product_images pi
  where pi.product_id = v_id
    and pi.storage_path not in (select x ->> 'storage_path' from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) x);

  delete from public.product_images where product_id = v_id and storage_path = any (v_removed);

  insert into public.product_images (product_id, storage_path, alt_text, display_order)
  select v_id, t.x ->> 'storage_path', nullif(t.x ->> 'alt_text', ''), (t.ord - 1)::integer
  from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) with ordinality as t (x, ord)
  on conflict (product_id, storage_path)
    do update set alt_text = excluded.alt_text, display_order = excluded.display_order;

  -- Collection assignments.
  delete from public.collection_products
  where product_id = v_id and not (collection_id = any (coalesce(p_collection_ids, '{}')));

  insert into public.collection_products (collection_id, product_id, display_order)
  select c, v_id,
         coalesce((select max(cp.display_order) + 1 from public.collection_products cp where cp.collection_id = c), 0)
  from unnest(coalesce(p_collection_ids, '{}')) as c
  on conflict (collection_id, product_id) do nothing;

  return jsonb_build_object('id', v_id, 'removed_paths', to_jsonb(v_removed));
end;
$$;

create or replace function public.save_collection(
  p_id uuid,
  p_data jsonb,
  p_product_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  if p_id is null then
    insert into public.collections (name, slug, description, banner_path, display_order, is_active, is_featured)
    values (
      p_data ->> 'name',
      p_data ->> 'slug',
      nullif(p_data ->> 'description', ''),
      nullif(p_data ->> 'banner_path', ''),
      coalesce((p_data ->> 'display_order')::integer, 0),
      coalesce((p_data ->> 'is_active')::boolean, true),
      coalesce((p_data ->> 'is_featured')::boolean, false)
    )
    returning id into v_id;
  else
    update public.collections set
      name          = p_data ->> 'name',
      slug          = p_data ->> 'slug',
      description   = nullif(p_data ->> 'description', ''),
      banner_path   = nullif(p_data ->> 'banner_path', ''),
      display_order = coalesce((p_data ->> 'display_order')::integer, 0),
      is_active     = coalesce((p_data ->> 'is_active')::boolean, true),
      is_featured   = coalesce((p_data ->> 'is_featured')::boolean, false)
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'collection not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.collection_products
  where collection_id = v_id and not (product_id = any (coalesce(p_product_ids, '{}')));

  insert into public.collection_products (collection_id, product_id, display_order)
  select v_id, t.pid, (t.ord - 1)::integer
  from unnest(coalesce(p_product_ids, '{}')) with ordinality as t (pid, ord)
  on conflict (collection_id, product_id) do update set display_order = excluded.display_order;

  return v_id;
end;
$$;

revoke all on function public.save_product(uuid, jsonb, jsonb, uuid[]) from public, anon;
revoke all on function public.save_collection(uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.save_product(uuid, jsonb, jsonb, uuid[]) to authenticated;
grant execute on function public.save_collection(uuid, jsonb, uuid[]) to authenticated;
