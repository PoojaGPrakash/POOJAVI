import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { requireAdminPage } from "@/lib/auth";
import { getCollection, listProductOptions } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Edit collection" };

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdminPage();
  const [collection, products] = await Promise.all([getCollection(supabase, id), listProductOptions(supabase)]);
  if (!collection) notFound();
  return (
    <>
      <AdminPageHeader title={collection.name} back={{ href: "/admin/collections", label: "Collections" }} />
      <CollectionForm collection={collection} products={products} />
    </>
  );
}
