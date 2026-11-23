/** Fixed brand identity (not business data — that lives in site_settings). */
export const brand = {
  name: "POOJAVI",
  label: "THE LABEL",
  fullName: "Poojavi The Label",
  tagline: "Wear a Story",
  /**
   * Business WhatsApp number. Used whenever no number has been saved in
   * Admin → Settings (or the NEXT_PUBLIC_FALLBACK_WHATSAPP_NUMBER env var),
   * so WhatsApp buttons are never silently hidden.
   */
  whatsappNumber: "+917204687075",
} as const;

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/fabrics", label: "Fabrics" },
  { href: "/sarees", label: "Sarees" },
  { href: "/collections", label: "Collections" },
  { href: "/our-story", label: "Our Story" },
  { href: "/contact", label: "Contact" },
] as const;

export const policyPages = [
  { slug: "privacy-policy", label: "Privacy Policy", field: "privacy_policy" },
  { slug: "terms-and-conditions", label: "Terms & Conditions", field: "terms_conditions" },
  { slug: "shipping-policy", label: "Shipping Policy", field: "shipping_policy" },
  { slug: "no-returns-policy", label: "No Returns Policy", field: "returns_policy" },
] as const;

export type PolicySlug = (typeof policyPages)[number]["slug"];
