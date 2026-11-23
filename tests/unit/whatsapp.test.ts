import { describe, expect, it } from "vitest";
import { buildWhatsAppLink, normaliseWhatsAppNumber, productEnquiryMessage } from "@/lib/whatsapp";

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

  it("uses the exact product enquiry wording", () => {
    expect(productEnquiryMessage("Ivory Banarasi")).toBe("Hello Poojavi The Label, I am interested in Ivory Banarasi. Please share more details.");
    expect(productEnquiryMessage("  Ivory Banarasi ", "PJ-1")).toBe("Hello Poojavi The Label, I am interested in Ivory Banarasi. (Ref: PJ-1) Please share more details.");
  });
});
