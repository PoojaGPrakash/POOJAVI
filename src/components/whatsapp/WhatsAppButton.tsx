"use client";

import type { ReactNode } from "react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "./SiteConfigProvider";
import { WhatsAppIcon } from "./WhatsAppIcon";

type Props = {
  /** Pre-filled message. Falls back to the default message from settings. */
  message?: string;
  className?: string;
  children?: ReactNode;
  variant?: "primary" | "outline" | "light" | "icon";
  label?: string;
};

/**
 * Reusable WhatsApp enquiry link. The business number comes from site
 * settings (single source of truth). If no number is configured the button
 * is not rendered, so visitors never see a dead control.
 */
export function WhatsAppButton({ message, className, children, variant = "primary", label = "Enquire on WhatsApp" }: Props) {
  const { whatsappNumber, whatsappDefaultMessage } = useSiteConfig();
  const href = buildWhatsAppLink(whatsappNumber, message ?? whatsappDefaultMessage ?? undefined);
  if (!href) return null;

  const styles = {
    primary: "btn-primary",
    outline: "btn-outline",
    light: "btn-light",
    icon: "inline-flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:text-burgundy",
  } as const;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(styles[variant], className)}
      aria-label={variant === "icon" ? label : undefined}
      data-testid="whatsapp-link"
    >
      <WhatsAppIcon className={variant === "icon" ? "h-[22px] w-[22px]" : "h-4 w-4"} />
      {variant !== "icon" && (children ?? label)}
    </a>
  );
}
