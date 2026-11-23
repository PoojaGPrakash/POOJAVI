import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { BannerForm } from "@/components/admin/BannerForm";
import { requireAdminPage } from "@/lib/auth";
import { getBanner } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Edit banner" };

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdminPage();
  const banner = await getBanner(supabase, id);
  if (!banner) notFound();
  return (
    <>
      <AdminPageHeader title={banner.title} back={{ href: "/admin/banners", label: "Homepage banners" }} />
      <BannerForm banner={banner} />
    </>
  );
}
