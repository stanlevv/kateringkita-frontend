import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("LG-N1 next aman (Review Focus 4)", () => {
  it("path internal lolos", () => expect(safeNext("/menu?q=a")).toBe("/menu?q=a"));
  it.each([
    "https://evil.com", "//evil.com", "/\\evil.com", "\\evil.com", "/a\nb", "/\t/evil.com", "/\r/evil.com", "/\u0000/evil.com",
    "/\u007f/evil.com", "menu", "", null, undefined,
  ])("%j -> /dashboard", (v) => expect(safeNext(v)).toBe("/dashboard"));
  it("fallback bisa diganti", () => expect(safeNext("//evil.com", "/pratinjau")).toBe("/pratinjau"));
  it.each(["/%2F%2Fevil.com", "/..//evil.com"])("%j: origin tetap sama setelah parsing -> lolos", (v) => {
    // Cek origin (new URL) adalah lapis kedua di belakang pola karakter.
    expect(new URL(v, "http://x.invalid").origin).toBe("http://x.invalid");
    expect(safeNext(v)).toBe(v);
  });
});
