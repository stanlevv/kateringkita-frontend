import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("LG-N1 next aman (Review Focus 4)", () => {
  it("path internal lolos", () => expect(safeNext("/menu?q=a")).toBe("/menu?q=a"));
  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "\\evil.com",
    "/a\nb",
    "/\t/evil.com",
    "/\r/evil.com",
    "/\u0000/evil.com",
    "/\u007f/evil.com",
    "menu",
    "",
    null,
    undefined,
    // AUD-30: dinormalisasi menjadi "//evil.com" (protocol-relative) oleh URL parser maupun Next
    "/..//evil.com",
    "/./..//evil.com/x",
  ])("%j -> /dashboard", (v) => expect(safeNext(v)).toBe("/dashboard"));
  it("fallback bisa diganti", () => expect(safeNext("//evil.com", "/pratinjau")).toBe("/pratinjau"));
  it("/%2F%2Fevil.com tetap path internal (garis miring tersandi tidak dinormalisasi)", () =>
    expect(safeNext("/%2F%2Fevil.com")).toBe("/%2F%2Fevil.com"));
  it("yang dikembalikan adalah path hasil normalisasi", () => expect(safeNext("/a/../menu?q=1#x")).toBe("/menu?q=1#x"));
});
