import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/ui";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { requireAdminPage } from "@/lib/auth";
import { listProductOptions } from "@/lib/data/admin";

export const metadata: Metadata = { title: "New collection" };

export default async function NewCollectionPage() {
  const { supabase } = await requireAdminPage();
  const products = await listProductOptions(supabase);
  return (
    <>
      <AdminPageHeader title="New collection" back={{ href: "/admin/collections", label: "Collections" }} />
      <CollectionForm products={products} />
    </>
  );
}
