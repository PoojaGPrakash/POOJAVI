import { InstagramIcon } from "@/components/ui/InstagramIcon";
import type { Metadata } from "next";
import { Mail, MapPin, Clock, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/ContactForm";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { getProductBySlug, getSiteSettings } from "@/lib/data/public";
import { normaliseWhatsAppNumber } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Poojavi The Label on WhatsApp, Instagram or email — we reply personally to every enquiry.",
  alternates: { canonical: "/contact" },
};

type Props = { searchParams: Promise<{ product?: string | string[] }> };

export default async function ContactPage({ searchParams }: Props) {
  const rawSlug = (await searchParams).product;
  const slug = typeof rawSlug === "string" && /^[a-z0-9-]{1,120}$/.test(rawSlug) ? rawSlug : null;
  const [settings, product] = await Promise.all([getSiteSettings(), slug ? getProductBySlug(slug) : Promise.resolve(null)]);
  const hasWhatsApp = Boolean(normaliseWhatsAppNumber(settings.whatsapp_number));
  const handle = settings.instagram_handle?.replace(/^@/, "");

  return (
    <>
      <PageHeader eyebrow="We would love to hear from you" title="Contact" description="For availability, pricing, additional photographs or styling advice, reach out — every message is answered personally." crumbs={[{ label: "Contact" }]} />
      <div className="container-luxe grid gap-14 pb-24 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <aside className="space-y-10">
          {hasWhatsApp && (
            <div className="border border-line bg-white/60 p-7 sm:p-9">
              <p className="eyebrow mb-3">Fastest response</p>
              <h2 className="heading-3">Chat on WhatsApp</h2>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/70">Share what you are looking for and we will help you choose.</p>
              <WhatsAppButton className="mt-6 w-full" label="Message us on WhatsApp" />
            </div>
          )}
          <ul className="space-y-5 text-sm">
            {settings.instagram_url && (
              <ContactRow icon={<InstagramIcon className="h-4 w-4" />} label="Instagram">
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-burgundy">
                  {handle ? `@${handle}` : "Follow us"}
                </a>
              </ContactRow>
            )}
            {settings.contact_email && (
              <ContactRow icon={<Mail className="h-4 w-4" strokeWidth={1.25} />} label="Email">
                <a href={`mailto:${settings.contact_email}`} className="break-all hover:text-burgundy">
                  {settings.contact_email}
                </a>
              </ContactRow>
            )}
            {settings.contact_phone && (
              <ContactRow icon={<Phone className="h-4 w-4" strokeWidth={1.25} />} label="Phone">
                <a href={`tel:${settings.contact_phone.replace(/[^+\d]/g, "")}`} className="hover:text-burgundy">
                  {settings.contact_phone}
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
          {product && <p className="mb-6 text-sm text-charcoal/70">Regarding: <span className="font-medium text-charcoal">{product.name}</span></p>}
          <div className="mt-6">
            <ContactForm productId={product?.id} defaultSubject={product ? `Enquiry: ${product.name}` : undefined} />
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
