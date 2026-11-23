import { InstagramIcon } from "@/components/ui/InstagramIcon";
import type { Metadata } from "next";
import { MapPin, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { WhatsAppEnquiryForm } from "@/components/WhatsAppEnquiryForm";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { getProductBySlug, getSiteSettings } from "@/lib/data/public";
import { productCode } from "@/lib/whatsapp";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Poojavi The Label on WhatsApp or Instagram — we reply personally to every enquiry.",
  alternates: { canonical: "/contact" },
};

type Props = { searchParams: Promise<{ product?: string | string[] }> };

export default async function ContactPage({ searchParams }: Props) {
  const rawSlug = (await searchParams).product;
  const slug = typeof rawSlug === "string" && /^[a-z0-9-]{1,120}$/.test(rawSlug) ? rawSlug : null;
  const [settings, product] = await Promise.all([getSiteSettings(), slug ? getProductBySlug(slug) : Promise.resolve(null)]);
  const enquiryProduct = product
    ? { name: product.name, slug: product.slug, sku: product.sku, code: productCode(product), category: product.category?.name, colours: product.colours }
    : null;
  const handle = settings.instagram_handle?.replace(/^@/, "");

  return (
    <>
      <PageHeader eyebrow="We would love to hear from you" title="Contact" description="For availability, pricing, additional photographs or styling advice, reach out — every message is answered personally." crumbs={[{ label: "Contact" }]} />
      <div className="container-luxe grid gap-14 pb-24 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <aside className="space-y-10">
          <div className="border border-line bg-white/60 p-7 sm:p-9">
            <p className="eyebrow mb-3">Fastest response</p>
            <h2 className="heading-3">Chat on WhatsApp</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/70">Share what you are looking for and we will help you choose.</p>
            <WhatsAppButton className="mt-6 w-full" label="Message us on WhatsApp" />
            {settings.whatsapp_number && <p className="mt-4 text-center text-sm tracking-wide text-charcoal/80">{settings.whatsapp_number}</p>}
          </div>
          <ul className="space-y-5 text-sm">
            {settings.instagram_url && (
              <ContactRow icon={<InstagramIcon className="h-4 w-4" />} label="Instagram">
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-burgundy">
                  {handle ? `@${handle}` : "Follow us"}
                </a>
              </ContactRow>
            )}
            {settings.contact_address && (
              <ContactRow icon={<MapPin className="h-4 w-4" strokeWidth={1.25} />} label="Studio">
                <span className="whitespace-pre-line">{settings.contact_address}</span>
              </ContactRow>
            )}
            {settings.business_hours && (
              <ContactRow icon={<Clock className="h-4 w-4" strokeWidth={1.25} />} label="Hours">
                {settings.business_hours}
              </ContactRow>
            )}
          </ul>
        </aside>
        <section aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" className="heading-3 mb-2">
            Send an enquiry
          </h2>
          <div className="mt-6">
            <WhatsAppEnquiryForm product={enquiryProduct} siteUrl={env.siteUrl} />
          </div>
        </section>
      </div>
    </>
  );
}

function ContactRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-line text-burgundy">{icon}</span>
      <div>
        <p className="text-[0.62rem] tracking-[0.22em] text-muted uppercase">{label}</p>
        <div className="mt-1 text-charcoal">{children}</div>
      </div>
    </li>
  );
}
