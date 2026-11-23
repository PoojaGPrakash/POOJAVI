import { describe, expect, it } from "vitest";
import { emptyToNull, parseList, slugify, toParagraphs, truncate } from "@/lib/utils";

describe("slugify", () => {
  it("creates URL-safe slugs", () => {
    expect(slugify("Raw Silk — Ivory")).toBe("raw-silk-ivory");
    expect(slugify("  Pochampally Ikat & Zari  ")).toBe("pochampally-ikat-and-zari");
    expect(slugify("Crème Brûlée")).toBe("creme-brulee");
    expect(slugify("---")).toBe("");
  });
  it("matches the database slug domain", () => {
    const re = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const s of ["Banarasi Silk 2026", "A  B", "Ivory/Gold", "x".repeat(200)]) expect(slugify(s)).toMatch(re);
    expect(slugify("x".repeat(200)).length).toBeLessThanOrEqual(120);
  });
});

describe("text helpers", () => {
  it("splits paragraphs on blank lines", () => {
    expect(toParagraphs("One\n\nTwo\n \nThree")).toEqual(["One", "Two", "Three"]);
    expect(toParagraphs(null)).toEqual([]);
  });
  it("parses colour lists, trimming and de-duplicating", () => {
    expect(parseList("Ivory, Gold ,ivory,\nRuby Red,,")).toEqual(["Ivory", "Gold", "Ruby Red"]);
  });
  it("converts empty strings to null", () => {
    expect(emptyToNull("  ")).toBeNull();
    expect(emptyToNull(" a ")).toBe("a");
    expect(emptyToNull(undefined)).toBeNull();
  });
  it("truncates with an ellipsis", () => {
    expect(truncate("abcdef", 10)).toBe("abcdef");
    expect(truncate("abcdefghijkl", 6)).toBe("abcde…");
  });
});
