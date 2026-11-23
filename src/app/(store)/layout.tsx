import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/whatsapp/FloatingWhatsApp";
import { SiteConfigProvider, type PublicSiteConfig } from "@/components/whatsapp/SiteConfigProvider";
import { getSiteSettings } from "@/lib/data/public";
import { brand } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: { default: s.seo_title || `${brand.fullName} — Premium Indian Fabrics & Sarees`, template: `%s | ${brand.fullName}` },
    description: s.seo_description || undefined,
  };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const config: PublicSiteConfig = {
    whatsappNumber: settings.whatsapp_number,
    whatsappDefaultMessage: settings.whatsapp_default_message,
    instagramUrl: settings.instagram_url,
    instagramHandle: settings.instagram_handle,
    contactEmail: settings.contact_email,
  };

  return (
    <SiteConfigProvider value={config}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-ivory focus:px-4 focus:py-2">
        Skip to content
      </a>
      <AnnouncementBar text={settings.announcement_enabled ? settings.announcement_text : null} />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
      <FloatingWhatsApp />
    </SiteConfigProvider>
  );
}
