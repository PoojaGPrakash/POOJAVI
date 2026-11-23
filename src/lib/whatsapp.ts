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

/** The code shown to customers and sent on WhatsApp: the SKU, else the URL slug. */
export function productCode(product: { sku?: string | null; slug: string }): string {
  return product.sku?.trim() || product.slug.toUpperCase();
}

export type EnquiryProduct = {
  name: string;
  slug: string;
  sku?: string | null;
  category?: string | null;
  colours?: string[] | null;
};

/**
 * Pre-filled WhatsApp message for a product enquiry. Carries the product name,
 * product code and a link back to the product so the team can identify the
 * exact piece instantly.
 */
export function productEnquiryMessage(product: EnquiryProduct, siteUrl?: string): string {
  const lines = [
    `Hello ${brand.fullName}, I am interested in this product:`,
    "",
    `Product: ${product.name.trim()}`,
    `Product Code: ${productCode(product)}`,
  ];
  if (product.category) lines.push(`Category: ${product.category}`);
  if (product.colours?.length) lines.push(`Colours: ${product.colours.join(", ")}`);
  if (siteUrl) lines.push(`Link: ${siteUrl.replace(/\/+$/, "")}/products/${product.slug}`);
  lines.push("", "Please share the price, availability and more details.");
  return lines.join("\n");
}
