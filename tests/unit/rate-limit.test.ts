import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit within the window and resets afterwards", () => {
    const key = `t-${Math.random()}`;
    const t0 = 1_000_000;
    expect([1, 2, 3].map(() => rateLimit(key, 3, 1000, t0))).toEqual([true, true, true]);
    expect(rateLimit(key, 3, 1000, t0 + 10)).toBe(false);
    expect(rateLimit(key, 3, 1000, t0 + 1001)).toBe(true);
  });
});
