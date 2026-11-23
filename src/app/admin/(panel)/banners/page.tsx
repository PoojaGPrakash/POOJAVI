import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus } from "lucide-react";
import { AdminPageHeader, EmptyAdminState, StatusBadge } from "@/components/admin/ui";
import { BannerActiveToggle } from "@/components/admin/BannerRowActions";
import { requireAdminPage } from "@/lib/auth";
import { listBanners } from "@/lib/data/admin";
import { publicImageUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Homepage banners" };

export default async function AdminBannersPage() {
  const { supabase } = await requireAdminPage();
  const banners = await listBanners(supabase);
  return (
    <>
      <AdminPageHeader
        title="Homepage banners"
        description="Hero slides at the top of the homepage. Multiple visible banners rotate automatically."
        action={
          <Link href="/admin/banners/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New banner
          </Link>
        }
      />
      {banners.length ? (
        <ul className="divide-y divide-line border border-line bg-white">
          {banners.map((b) => {
            const img = publicImageUrl(b.image_path);
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap sm:p-4">
                <Link href={`/admin/banners/${b.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden bg-beige">{img && <Image src={img} alt="" fill sizes="96px" className="object-cover" />}</div>
                  <div className="min-w-0">
                    <p className="truncate font-medium hover:text-burgundy">{b.title}</p>
                    <p className="truncate text-xs text-muted">{b.subtitle ?? "—"}</p>
                    <div className="mt-1 flex gap-1.5">
                      <StatusBadge tone="grey">Order {b.display_order}</StatusBadge>
                      {!img && <StatusBadge tone="amber">No image</StatusBadge>}
                    </div>
                  </div>
                </Link>
                <BannerActiveToggle id={b.id} isActive={b.is_active} />
                <Link href={`/admin/banners/${b.id}`} className="inline-flex h-10 w-10 items-center justify-center hover:text-burgundy" aria-label={`Edit ${b.title}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyAdminState
          title="No banners yet"
          description="Until you add one, the homepage shows an elegant brand hero."
          action={
            <Link href="/admin/banners/new" className="btn-primary">
              <Plus className="h-4 w-4" /> New banner
            </Link>
          }
        />
      )}
    </>
  );
}
