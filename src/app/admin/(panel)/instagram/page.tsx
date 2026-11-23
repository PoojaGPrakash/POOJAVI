import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/ui";
import { InstagramManager } from "@/components/admin/InstagramManager";
import { requireAdminPage } from "@/lib/auth";
import { listInstagramPosts } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Instagram gallery" };

export default async function AdminInstagramPage() {
  const { supabase } = await requireAdminPage();
  const posts = await listInstagramPosts(supabase);
  return (
    <>
      <AdminPageHeader title="Instagram gallery" description="Images shown in the homepage Instagram section, each optionally linking to a post. Set your profile link under Site Content & Settings." />
      <InstagramManager posts={posts} />
    </>
  );
}
