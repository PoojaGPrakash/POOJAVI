import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, EmptyAdminState } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminPage } from "@/lib/auth";
import { listCategoryOptions, listCollectionOptions } from "@/lib/data/admin";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const { supabase } = await requireAdminPage();
  const [categories, collections] = await Promise.all([listCategoryOptions(supabase), listCollectionOptions(supabase)]);
  return (
    <>
      <AdminPageHeader title="New product" back={{ href: "/admin/products", label: "Products" }} />
      {categories.length ? (
        <ProductForm categories={categories} collections={collections} />
      ) : (
        <EmptyAdminState
          title="Create a category first"
          description="Every product belongs to a category. Add one before creating products."
          action={
            <Link href="/admin/categories/new" className="btn-primary">
              Add category
            </Link>
          }
        />
      )}
    </>
  );
}
