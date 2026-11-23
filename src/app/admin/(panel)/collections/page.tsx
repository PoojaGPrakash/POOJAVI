import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader, EmptyAdminState } from "@/components/admin/ui";
import { CollectionList } from "@/components/admin/CollectionList";
import { requireAdminPage } from "@/lib/auth";
import { listCollections } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Collections" };

export default async function AdminCollectionsPage() {
  const { supabase } = await requireAdminPage();
  const collections = await listCollections(supabase);
  return (
    <>
      <AdminPageHeader
        title="Collections"
        description="Curated edits that group products across categories. Mark collections as featured to show them on the homepage."
        action={
          <Link href="/admin/collections/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New collection
          </Link>
        }
      />
      {collections.length ? (
        <CollectionList collections={collections} />
      ) : (
        <EmptyAdminState
          title="No collections yet"
          description="Create a collection such as “The Wedding Edit” and assign products to it."
          action={
            <Link href="/admin/collections/new" className="btn-primary">
              <Plus className="h-4 w-4" /> New collection
            </Link>
          }
        />
      )}
    </>
  );
}
