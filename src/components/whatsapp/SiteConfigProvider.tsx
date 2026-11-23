"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Public, non-sensitive contact configuration shared with client components. */
export type PublicSiteConfig = {
  whatsappNumber: string | null;
  whatsappDefaultMessage: string | null;
  instagramUrl: string | null;
  instagramHandle: string | null;
  contactEmail: string | null;
};

const SiteConfigContext = createContext<PublicSiteConfig | null>(null);

export function SiteConfigProvider({ value, children }: { value: PublicSiteConfig; children: ReactNode }) {
  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig(): PublicSiteConfig {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error("useSiteConfig must be used inside <SiteConfigProvider>");
  return ctx;
}
