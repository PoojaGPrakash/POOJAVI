import { InstagramIcon } from "@/components/ui/InstagramIcon";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { WhatsAppIcon } from "@/components/whatsapp/WhatsAppIcon";
import { brand, mainNav, policyPages } from "@/lib/brand";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { SiteSettings } from "@/lib/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  const whatsapp = buildWhatsAppLink(settings.whatsapp_number, settings.whatsapp_default_message ?? undefined);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-charcoal text-ivory/85">
      <div className="container-luxe py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-6">
            <Logo size="lg" tone="light" showTagline />
            {settings.footer_about && <p className="max-w-sm text-sm leading-relaxed text-ivory/65">{settings.footer_about}</p>}
          </div>

          <nav aria-label="Footer">
            <h2 className="mb-5 font-sans text-[0.66rem] font-medium tracking-[0.28em] text-champagne uppercase">Explore</h2>
            <ul className="space-y-3 text-sm">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-champagne">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/new-arrivals" className="transition-colors hover:text-champagne">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="mb-5 font-sans text-[0.66rem] font-medium tracking-[0.28em] text-champagne uppercase">Connect</h2>
            <ul className="space-y-3 text-sm">
              {whatsapp && (
                <li>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 transition-colors hover:text-champagne">
                    <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                  </a>
                </li>
              )}
              {settings.instagram_url && (
                <li>
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 transition-colors hover:text-champagne">
                    <InstagramIcon className="h-4 w-4" /> {settings.instagram_handle ? `@${settings.instagram_handle.replace(/^@/, "")}` : "Instagram"}
                  </a>
                </li>
              )}
              {settings.contact_email && (
                <li>
                  <a href={`mailto:${settings.contact_email}`} className="inline-flex items-center gap-2.5 break-all transition-colors hover:text-champagne">
                    <Mail className="h-4 w-4 shrink-0" strokeWidth={1.25} /> {settings.contact_email}
                  </a>
                </li>
              )}
              <li>
                <Link href="/contact" className="transition-colors hover:text-champagne">
                  Contact form
                </Link>
              </li>
            </ul>
          </div>

          <nav aria-label="Policies">
            <h2 className="mb-5 font-sans text-[0.66rem] font-medium tracking-[0.28em] text-champagne uppercase">Policies</h2>
            <ul className="space-y-3 text-sm">
              {policyPages.map((p) => (
                <li key={p.slug}>
                  <Link href={`/policies/${p.slug}`} className="transition-colors hover:text-champagne">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-ivory/15 pt-8 text-[0.66rem] tracking-[0.2em] text-ivory/50 uppercase sm:flex-row">
          <p>
            © {year} {brand.fullName}
          </p>
          <p className="font-serif text-sm tracking-[0.25em] normal-case italic">{brand.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
