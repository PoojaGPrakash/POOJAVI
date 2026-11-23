"use client";

import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useSiteConfig } from "./SiteConfigProvider";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function FloatingWhatsApp() {
  const { whatsappNumber, whatsappDefaultMessage } = useSiteConfig();
  const href = buildWhatsAppLink(whatsappNumber, whatsappDefaultMessage ?? undefined);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-burgundy text-ivory shadow-[0_10px_30px_-10px_rgba(40,37,34,0.6)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-burgundy-dark sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}
