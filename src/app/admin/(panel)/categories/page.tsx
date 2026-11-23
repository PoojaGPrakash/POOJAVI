import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { AdminPageHeader, EmptyAdminState, StatusBadge } from "@/components/admin/ui";
import { CategoryRowActions } from "@/components/admin/CategoryRowActions";
import { requireAdminPage } from "@/lib/auth";
import { listCategories } from "@/lib/data/admin";
import { publicImageUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdminPage();
  const categories = await listCategories(supabase);
  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="Categories organise products under Fabrics or Sarees and each has its own page."
        action={
          <Link href="/admin/categories/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Add category
          </Link>
        }
      />
      {categories.length ? (
        <ul className="divide-y divide-line border border-line bg-white">
          {categories.map((c) => {
            const img = publicImageUrl(c.image_path);
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap sm:p-4">
                <Link href={`/admin/categories/${c.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-beige">{img && <Image src={img} alt="" fill sizes="44px" className="object-cover" />}</div>
                  <div className="min-w-0">
                    <p className="truncate font-medium hover:text-burgundy">{c.name}</p>
                    <p className="text-xs text-muted">
                      /{c.slug} · {c.product_count} product{c.product_count === 1 ? "" : "s"} · order {c.display_order}
                    </p>
                    <div className="mt-1.5 flex gap-1.5">
                      <StatusBadge tone="grey">{c.department}</StatusBadge>
                      {!c.is_active && <StatusBadge tone="amber">Hidden</StatusBadge>}
                    </div>
                  </div>
                </Link>
                <CategoryRowActions
                  id={c.id}
                  name={c.name}
                  isActive={c.is_active}
                  productCount={c.product_count}
                  otherCategories={categories.filter((o) => o.id !== c.id).map((o) => ({ id: o.id, name: o.name }))}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyAdminState title="No categories yet" description="Create categories such as Raw Silk or Banarasi to organise products." />
      )}
    </>
  );
}
