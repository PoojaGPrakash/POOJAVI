import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase } = await requireAdminPage();
  const { count } = await supabase.from("contact_enquiries").select("id", { count: "exact", head: true }).eq("status", "new");
  return (
    <AdminShell email={user.email ?? ""} newEnquiries={count ?? 0}>
      {children}
    </AdminShell>
  );
}
