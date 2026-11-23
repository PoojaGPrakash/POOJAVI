import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FileEdit, FolderTree, Inbox, Layers, Package, Plus, Star, Eye } from "lucide-react";
import { AdminPageHeader, Card, StatusBadge, EmptyAdminState } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/admin";
import { publicImageUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const { supabase, profile } = await requireAdminPage();
  const stats = await getDashboardStats(supabase);

  const cards = [
    { label: "Total products", value: stats.totalProducts, icon: Package, href: "/admin/products" },
    { label: "Published", value: stats.publishedProducts, icon: Eye, href: "/admin/products?status=published" },
    { label: "Drafts", value: stats.draftProducts, icon: FileEdit, href: "/admin/products?status=draft" },
    { label: "Featured", value: stats.featuredProducts, icon: Star, href: "/admin/products" },
    { label: "Categories", value: stats.totalCategories, icon: FolderTree, href: "/admin/categories" },
    { label: "Collections", value: stats.totalCollections, icon: Layers, href: "/admin/collections" },
    { label: "New enquiries", value: stats.newEnquiries, icon: Inbox, href: "/admin/enquiries" },
  ];

  return (
    <>
      <AdminPageHeader
        title={`Welcome${profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="An overview of your catalogue."
        action={
          <Link href="/admin/products/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        }
      />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <li key={label}>
            <Link href={href} className="block border border-line bg-white p-4 transition-colors hover:border-charcoal/40 sm:p-5">
              <Icon className="h-4 w-4 text-champagne-dark" strokeWidth={1.5} />
              <p className="mt-3 font-serif text-3xl sm:text-4xl">{value}</p>
              <p className="mt-1 text-[0.66rem] tracking-[0.16em] text-muted uppercase">{label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <Card title="Recently added products" className="mt-8">
        {stats.recent.length ? (
          <ul className="divide-y divide-line">
            {stats.recent.map((p) => {
              const img = publicImageUrl(p.images[0]?.storage_path);
              return (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 py-3 hover:bg-ivory/60">
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-beige">
                      {img && <Image src={img} alt="" fill sizes="44px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted">
                        {p.category?.name ?? "—"} · Added {formatDate(p.created_at)}
                      </p>
                    </div>
                    <StatusBadge tone={p.status === "published" ? "green" : "amber"}>{p.status}</StatusBadge>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyAdminState
            title="No products yet"
            description="Add your first fabric or saree to begin building the catalogue."
            action={
              <Link href="/admin/products/new" className="btn-primary">
                <Plus className="h-4 w-4" /> Add product
              </Link>
            }
          />
        )}
      </Card>
    </>
  );
}
