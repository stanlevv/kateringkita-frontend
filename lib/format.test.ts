import { describe, expect, it, vi } from "vitest";
import { formatJam, formatRupiah, formatTanggal, formatTelepon, geserWib, hariIniWib, inputWibKeIso, isoKeInputWib, jamWib, tanggalWib } from "./format";

describe("waktu WIB untuk input datetime-local", () => {
  it("WIB lokal <-> ISO UTC", () => {
    expect(inputWibKeIso("2026-10-31T09:00")).toBe("2026-10-31T02:00:00.000Z");
    expect(isoKeInputWib("2026-10-31T02:00:00.000Z")).toBe("2026-10-31T09:00");
    expect(isoKeInputWib("2026-10-31T20:00:00Z")).toBe("2026-11-01T03:00");
  });
  it("tidak valid -> string kosong", () => {
    expect(inputWibKeIso("")).toBe("");
    expect(inputWibKeIso("kemarin")).toBe("");
  });
});

describe("format", () => {
  it("formatRupiah", () => {
    expect(formatRupiah(18000)).toBe("Rp 18.000");
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(1250500)).toBe("Rp 1.250.500");
  });
  it("formatJam memakai zona Asia/Jakarta", () => {
    expect(formatJam("2026-10-31T04:42:00Z")).toBe("11.42");
    expect(formatJam("2026-10-31T17:05:00Z")).toBe("00.05");
  });
  it("formatTanggal", () => {
    expect(formatTanggal("2026-10-31T04:42:00Z")).toBe("31 Okt 2026");
    expect(formatTanggal("2026-10-31T20:00:00Z")).toBe("1 Nov 2026");
  });
  it("formatTelepon", () => {
    expect(formatTelepon("081234567890")).toBe("0812-3456-7890");
    expect(formatTelepon("6281234567890")).toBe("0812-3456-7890");
    expect(formatTelepon("0812")).toBe("0812");
  });
  it("WIB: tanggalWib, jamWib, geserWib, hariIniWib", () => {
    expect(tanggalWib("2026-10-30T17:30:00Z")).toBe("2026-10-31"); // 00.30 WIB
    expect(jamWib("2026-10-30T17:30:00Z")).toBe(0);
    expect(geserWib(Date.parse("2026-10-31T04:42:00Z")).getUTCHours()).toBe(11);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-30T18:00:00Z"));
    expect(hariIniWib()).toBe("2026-10-31");
    vi.useRealTimers();
  });
});
