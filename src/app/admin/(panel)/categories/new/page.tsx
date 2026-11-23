import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  await requireAdminPage();
  return (
    <>
      <AdminPageHeader title="New category" back={{ href: "/admin/categories", label: "Categories" }} />
      <CategoryForm />
    </>
  );
}
