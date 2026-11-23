import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/ui";
import { BannerForm } from "@/components/admin/BannerForm";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "New banner" };

export default async function NewBannerPage() {
  await requireAdminPage();
  return (
    <>
      <AdminPageHeader title="New banner" back={{ href: "/admin/banners", label: "Homepage banners" }} />
      <BannerForm />
    </>
  );
}
