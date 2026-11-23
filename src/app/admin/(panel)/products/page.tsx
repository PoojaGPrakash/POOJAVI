import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { AdminPageHeader, EmptyAdminState, StatusBadge } from "@/components/admin/ui";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { requireAdminPage } from "@/lib/auth";
import { listCategoryOptions, listProducts } from "@/lib/data/admin";
import { publicImageUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

type Props = { searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase } = await requireAdminPage();
  const status = sp.status === "draft" || sp.status === "published" ? sp.status : undefined;
  const categoryId = sp.category && /^[0-9a-f-]{36}$/i.test(sp.category) ? sp.category : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q?.slice(0, 60) ?? "";

  const [{ rows, total, pageCount }, categories] = await Promise.all([listProducts(supabase, { q, status, categoryId, page }), listCategoryOptions(supabase)]);

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q: q || undefined, status, category: categoryId, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "page" && v === "1")) params.set(k, v);
    const s = params.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"}. Published products appear on the website automatically.`}
        action={
          <Link href="/admin/products/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        }
      />

      <form className="mb-6 grid gap-3 border border-line bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto]" action="/admin/products">
        <label className="sr-only" htmlFor="pq">
          Search products
        </label>
        <input id="pq" name="q" defaultValue={q} placeholder="Search name, SKU or slug" className="field-input" />
        <label className="sr-only" htmlFor="pstatus">
          Status
        </label>
        <select id="pstatus" name="status" defaultValue={status ?? ""} className="field-input">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <label className="sr-only" htmlFor="pcat">
          Category
        </label>
        <select id="pcat" name="category" defaultValue={categoryId ?? ""} className="field-input">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-outline">
          Filter
        </button>
      </form>

      {rows.length ? (
        <div className="border border-line bg-white">
          <ul className="divide-y divide-line">
            {rows.map((p) => {
              const img = publicImageUrl(p.images[0]?.storage_path);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap sm:p-4">
                  <Link href={`/admin/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-beige">
                      {img && <Image src={img} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium hover:text-burgundy">{p.name}</p>
                      <p className="truncate text-xs text-muted">
                        {p.category?.name ?? "—"}
                        {p.sku ? ` · ${p.sku}` : ""} · Updated {formatDate(p.updated_at)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <StatusBadge tone={p.status === "published" ? "green" : "amber"}>{p.status}</StatusBadge>
                        {p.is_featured && <StatusBadge tone="burgundy">Featured</StatusBadge>}
                        {p.is_new_arrival && <StatusBadge tone="grey">New arrival</StatusBadge>}
                      </div>
                    </div>
                  </Link>
                  <ProductRowActions id={p.id} name={p.name} slug={p.slug} status={p.status} />
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <EmptyAdminState
          title={q || status || categoryId ? "No products match your filters" : "No products yet"}
          description={q || status || categoryId ? "Try a different search or clear the filters." : "Create your first product to start your catalogue."}
          action={
            q || status || categoryId ? (
              <Link href="/admin/products" className="btn-outline">
                Clear filters
              </Link>
            ) : (
              <Link href="/admin/products/new" className="btn-primary">
                <Plus className="h-4 w-4" /> Add product
              </Link>
            )
          }
        />
      )}

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={qs({ page: String(page - 1) })} className="btn-outline">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={qs({ page: String(page + 1) })} className="btn-outline">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
