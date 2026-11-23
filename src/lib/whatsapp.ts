import { brand } from "./brand";

/** Normalise a configured number ("+91 98765-43210") to wa.me digits. */
export function normaliseWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  // E.164 allows up to 15 digits; anything under 8 cannot be a full number.
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/**
 * Universal WhatsApp deep link. `wa.me` opens the app on iOS/Android and
 * WhatsApp Web / Desktop elsewhere.
 */
export function buildWhatsAppLink(number: string | null | undefined, message?: string): string | null {
  const digits = normaliseWhatsAppNumber(number);
  if (!digits) return null;
  const text = message?.trim();
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

export function productEnquiryMessage(productName: string, sku?: string | null): string {
  const base = `Hello ${brand.fullName}, I am interested in ${productName.trim()}.`;
  const ref = sku ? ` (Ref: ${sku})` : "";
  return `${base}${ref} Please share more details.`;
}
