import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, EmptyAdminState, StatusBadge } from "@/components/admin/ui";
import { EnquiryActions } from "@/components/admin/EnquiryActions";
import { requireAdminPage } from "@/lib/auth";
import { listEnquiries } from "@/lib/data/admin";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Enquiries" };

const filters = [
  { value: undefined, label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
] as const;

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = sp.status === "new" || sp.status === "read" || sp.status === "archived" ? sp.status : undefined;
  const { supabase } = await requireAdminPage();
  const enquiries = await listEnquiries(supabase, status);

  return (
    <>
      <AdminPageHeader title="Enquiries" description="Messages sent through the website contact form." />
      <nav aria-label="Filter enquiries" className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/enquiries?status=${f.value}` : "/admin/enquiries"}
            aria-current={status === f.value ? "page" : undefined}
            className={cn("border px-3 py-1.5 text-xs tracking-[0.12em] uppercase", status === f.value ? "border-burgundy bg-burgundy text-ivory" : "border-line bg-white")}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {enquiries.length ? (
        <ul className="space-y-3">
          {enquiries.map((e) => {
            const wa = e.phone ? buildWhatsAppLink(e.phone, `Hello ${e.name}, thank you for contacting Poojavi The Label.`) : null;
            return (
              <li key={e.id} className={cn("border bg-white p-4 sm:p-5", e.status === "new" ? "border-burgundy/30" : "border-line")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {e.name} <StatusBadge tone={e.status === "new" ? "burgundy" : e.status === "read" ? "grey" : "amber"}>{e.status}</StatusBadge>
                    </p>
                    <p className="mt-1 text-sm text-charcoal/70">
                      <a href={`mailto:${e.email}`} className="hover:text-burgundy">
                        {e.email}
                      </a>
                      {e.phone && (
                        <>
                          {" · "}
                          {wa ? (
                            <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-burgundy">
                              {e.phone} (WhatsApp)
                            </a>
                          ) : (
                            e.phone
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-muted">{formatDate(e.created_at)}</p>
                </div>
                {e.subject && <p className="mt-3 text-sm font-medium">{e.subject}</p>}
                {e.product && (
                  <p className="mt-1 text-xs text-muted">
                    Product:{" "}
                    <Link href={`/products/${e.product.slug}`} target="_blank" className="underline">
                      {e.product.name}
                    </Link>
                  </p>
                )}
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-charcoal/85">{e.message}</p>
                <div className="mt-4 border-t border-line pt-3">
                  <EnquiryActions id={e.id} status={e.status} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyAdminState title="No enquiries" description={status ? "No enquiries with this status." : "Messages from the contact form will appear here."} />
      )}
    </>
  );
}
