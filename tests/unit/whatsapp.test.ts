import { describe, expect, it } from "vitest";
import { buildWhatsAppLink, normaliseWhatsAppNumber, productCode, productEnquiryMessage } from "@/lib/whatsapp";

describe("WhatsApp helpers", () => {
  it("normalises formatted numbers to digits", () => {
    expect(normaliseWhatsAppNumber("+91 98450-12345")).toBe("919845012345");
    expect(normaliseWhatsAppNumber("(044) 2345 6789")).toBe("04423456789");
  });

  it("rejects missing or implausible numbers", () => {
    expect(normaliseWhatsAppNumber(null)).toBeNull();
    expect(normaliseWhatsAppNumber("")).toBeNull();
    expect(normaliseWhatsAppNumber("12345")).toBeNull();
    expect(normaliseWhatsAppNumber("1234567890123456")).toBeNull();
  });

  it("builds wa.me links with encoded messages", () => {
    expect(buildWhatsAppLink("+91 98450 12345")).toBe("https://wa.me/919845012345");
    expect(buildWhatsAppLink("+91 98450 12345", "Hi & hello?")).toBe("https://wa.me/919845012345?text=Hi%20%26%20hello%3F");
    expect(buildWhatsAppLink("+91 98450 12345", "   ")).toBe("https://wa.me/919845012345");
    expect(buildWhatsAppLink(undefined, "Hi")).toBeNull();
  });

  it("includes the product name, code and link in enquiries", () => {
    const msg = productEnquiryMessage(
      { name: "  Ivory Banarasi ", slug: "ivory-banarasi", sku: "PJ-1", category: "Banarasi", colours: ["Ivory", "Gold"] },
      "https://example.com/",
    );
    expect(msg).toBe(
      [
        "Hello Poojavi The Label, I am interested in this product:",
        "",
        "Product: Ivory Banarasi",
        "Product Code: PJ-1",
        "Category: Banarasi",
        "Colours: Ivory, Gold",
        "Link: https://example.com/products/ivory-banarasi",
        "",
        "Please share the price, availability and more details.",
      ].join("\n"),
    );
  });

  it("falls back to the slug as product code when no SKU is set", () => {
    expect(productCode({ sku: null, slug: "ivory-banarasi" })).toBe("IVORY-BANARASI");
    expect(productEnquiryMessage({ name: "Ivory Banarasi", slug: "ivory-banarasi" })).toContain("Product Code: IVORY-BANARASI");
  });
});
