import { describe, expect, it } from "vitest";
import { diLuarJamBuka, formatHariJam, inisial, labelJamBuka, modeSidebar, perluTindakan } from "./shell";

describe("SH-N1 mode sidebar dari cookie", () => {
  it("hanya 'ringkas' yang menciutkan; kosong/asing = lebar", () => {
    expect(modeSidebar("ringkas")).toBe("ringkas");
    expect(modeSidebar("lebar")).toBe("lebar");
    expect(modeSidebar(undefined)).toBe("lebar");
    expect(modeSidebar("<script>")).toBe("lebar");
  });
});

// 2026-10-31 04:42Z = 11.42 WIB (Sabtu)
const SIANG = Date.parse("2026-10-31T04:42:00Z");

describe("SH-N1 badge perlu tindakan", () => {
  it("menghitung holding dan confirmed saja", () => {
    const o = ["holding", "confirmed", "cooking", "ready", "completed", "holding"].map((status) => ({ status }));
    expect(perluTindakan(o as never)).toBe(3);
    expect(perluTindakan([])).toBe(0);
  });
});

describe("SH-A1 di luar jam buka", () => {
  it("di dalam rentang -> false", () => expect(diLuarJamBuka(SIANG, "07:00", "16:00")).toBe(false));
  it("sebelum buka -> true", () => expect(diLuarJamBuka(Date.parse("2026-10-30T22:30:00Z"), "07:00", "16:00")).toBe(true)); // 05.30 WIB
  it("tepat jam tutup -> true", () => expect(diLuarJamBuka(Date.parse("2026-10-31T09:00:00Z"), "07:00", "16:00")).toBe(true));
  it("lewat tengah malam (18.00–02.00)", () => {
    const wib = (h: number) => Date.parse("2026-10-31T00:00:00Z") + (h - 7) * 3600e3;
    expect(diLuarJamBuka(wib(23), "18:00", "02:00")).toBe(false);
    expect(diLuarJamBuka(wib(1), "18:00", "02:00")).toBe(false);
    expect(diLuarJamBuka(wib(2), "18:00", "02:00")).toBe(true);
    expect(diLuarJamBuka(wib(12), "18:00", "02:00")).toBe(true);
    expect(diLuarJamBuka(wib(18), "18:00", "02:00")).toBe(false);
  });
  it("label",() => expect(labelJamBuka("07:00", "16:00")).toBe("07.00–16.00"));
});

describe("SH-N2 jam & inisial", () => {
  it("format hari jam WIB", () => expect(formatHariJam(SIANG)).toBe("Sab, 31 Okt · 11.42 WIB"));
  it("inisial", () => {
    expect(inisial("Rohan Rifqi")).toBe("RR");
    expect(inisial("Budi")).toBe("B");
    expect(inisial("")).toBe("?");
  });
});
