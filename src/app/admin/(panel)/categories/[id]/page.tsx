import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { requireAdminPage } from "@/lib/auth";
import { getCategory } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdminPage();
  const category = await getCategory(supabase, id);
  if (!category) notFound();
  return (
    <>
      <AdminPageHeader title={category.name} back={{ href: "/admin/categories", label: "Categories" }} />
      <CategoryForm category={category} />
    </>
  );
}
