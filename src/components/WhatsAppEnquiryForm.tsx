"use client";

import { useState, type FormEvent } from "react";
import { brand } from "@/lib/brand";
import { buildWhatsAppLink, productEnquiryMessage, type EnquiryProduct } from "@/lib/whatsapp";
import { useSiteConfig } from "@/components/whatsapp/SiteConfigProvider";
import { WhatsAppIcon } from "@/components/whatsapp/WhatsAppIcon";

type Props = {
  /** When the visitor arrives from a product (`/contact?product=slug`). */
  product?: (EnquiryProduct & { code: string }) | null;
  siteUrl: string;
};

/**
 * Contact enquiry that is delivered over WhatsApp. Nothing is stored and no
 * email address is asked for: submitting opens WhatsApp with the message
 * (and product code, if any) already filled in.
 */
export function WhatsAppEnquiryForm({ product, siteUrl }: Props) {
  const { whatsappNumber } = useSiteConfig();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  function compose(): string {
    const parts: string[] = [];
    if (product) {
      parts.push(productEnquiryMessage(product, siteUrl));
    } else {
      parts.push(`Hello ${brand.fullName},`);
    }
    if (message.trim()) parts.push("", message.trim());
    if (name.trim()) parts.push("", `— ${name.trim()}`);
    return parts.join("\n");
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const href = buildWhatsAppLink(whatsappNumber, compose());
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {product && (
        <div className="border border-line bg-white/60 px-5 py-4 text-sm">
          <p className="text-[0.62rem] tracking-[0.22em] text-muted uppercase">Enquiring about</p>
          <p className="mt-1 font-serif text-lg text-charcoal">{product.name}</p>
          <p className="mt-0.5 text-charcoal/70">
            Product code: <span className="font-medium text-charcoal">{product.code}</span>
          </p>
        </div>
      )}
      <div>
        <label htmlFor="w-name" className="field-label">
          Your name
        </label>
        <input id="w-name" autoComplete="name" maxLength={80} className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="w-message" className="field-label">
          {product ? "Anything else? (optional)" : "What are you looking for?"}
        </label>
        <textarea
          id="w-message"
          rows={5}
          maxLength={1000}
          required={!product}
          className="field-input resize-y"
          placeholder={product ? "e.g. quantity, colour preference, delivery city" : "e.g. a pure silk saree in deep red for a wedding"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary w-full sm:w-auto">
        <WhatsAppIcon className="h-4 w-4" />
        Send on WhatsApp
      </button>
      <p className="text-xs leading-relaxed text-muted">This opens WhatsApp with your message ready to send. We reply personally to every enquiry.</p>
    </form>
  );
}
