import { describe, expect, it } from "vitest";
import { buildStoragePath, isManagedStoragePath, validateImageFile } from "@/lib/storage";

describe("storage paths", () => {
  it("builds unique, dated paths per folder", () => {
    const p = buildStoragePath("products", "image/jpeg", new Date("2026-11-23T00:00:00Z"), "3f9c2b4e-1a2b-4c3d-8e9f-0a1b2c3d4e5f");
    expect(p).toBe("products/2026/11/3f9c2b4e-1a2b-4c3d-8e9f-0a1b2c3d4e5f.jpg");
    expect(isManagedStoragePath(p)).toBe(true);
  });
  it("rejects unsupported types", () => {
    expect(() => buildStoragePath("products", "image/gif")).toThrow();
  });
  it("only treats our own paths as deletable", () => {
    expect(isManagedStoragePath("../secrets.txt")).toBe(false);
    expect(isManagedStoragePath("products/2026/11/../../x.jpg")).toBe(false);
    expect(isManagedStoragePath("other/2026/11/3f9c2b4e-1a2b-4c3d-8e9f-0a1b2c3d4e5f.jpg")).toBe(false);
  });
  it("validates image files", () => {
    expect(validateImageFile({ type: "image/png", size: 1000 })).toBeNull();
    expect(validateImageFile({ type: "image/gif", size: 1000 })).toMatch(/JPG/);
    expect(validateImageFile({ type: "image/jpeg", size: 11 * 1024 * 1024 })).toMatch(/10 MB/);
    expect(validateImageFile({ type: "image/jpeg", size: 0 })).toMatch(/empty/);
  });
});
