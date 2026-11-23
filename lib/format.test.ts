// Test format rupiah, jam, tanggal, waktu relatif, dan nomor telepon (WIB).
import { describe, expect, it, vi } from "vitest";
import {
  formatTime,
  formatRupiah,
  formatDate,
  formatPhone,
  toWibClock,
  todayWib,
  wibInputToIso,
  isoToWibInput,
  wibHour,
  wibDate,
  formatRelativeTime,
} from "./format";

describe("waktu WIB untuk input datetime-local", () => {
  it("WIB lokal <-> ISO UTC", () => {
    expect(wibInputToIso("2026-10-31T09:00")).toBe("2026-10-31T02:00:00.000Z");
    expect(isoToWibInput("2026-10-31T02:00:00.000Z")).toBe("2026-10-31T09:00");
    expect(isoToWibInput("2026-10-31T20:00:00Z")).toBe("2026-11-01T03:00");
  });
  it("tidak valid -> string kosong", () => {
    expect(wibInputToIso("")).toBe("");
    expect(wibInputToIso("kemarin")).toBe("");
  });
});

describe("format", () => {
  it("formatRupiah", () => {
    expect(formatRupiah(18000)).toBe("Rp 18.000");
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(1250500)).toBe("Rp 1.250.500");
  });
  it("formatTime memakai zona Asia/Jakarta", () => {
    expect(formatTime("2026-10-31T04:42:00Z")).toBe("11.42");
    expect(formatTime("2026-10-31T17:05:00Z")).toBe("00.05");
  });
  it("formatDate", () => {
    expect(formatDate("2026-10-31T04:42:00Z")).toBe("31 Okt 2026");
    expect(formatDate("2026-10-31T20:00:00Z")).toBe("1 Nov 2026");
  });
  it("formatPhone", () => {
    expect(formatPhone("081234567890")).toBe("0812-3456-7890");
    expect(formatPhone("6281234567890")).toBe("0812-3456-7890");
    expect(formatPhone("0812")).toBe("0812");
  });
  it("WIB: wibDate, wibHour, toWibClock, todayWib", () => {
    expect(wibDate("2026-10-30T17:30:00Z")).toBe("2026-10-31"); // 00.30 WIB
    expect(wibHour("2026-10-30T17:30:00Z")).toBe(0);
    expect(toWibClock(Date.parse("2026-10-31T04:42:00Z")).getUTCHours()).toBe(11);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-30T18:00:00Z"));
    expect(todayWib()).toBe("2026-10-31");
    vi.useRealTimers();
  });
});

describe("formatRelativeTime", () => {
  const NOW = Date.parse("2026-11-13T10:00:00Z");
  const ago = (offsetMs: number) => new Date(NOW - offsetMs).toISOString();
  it("menit, jam, hari; di bawah 1 menit (atau jam server sedikit maju) -> Baru saja", () => {
    expect(formatRelativeTime(ago(30e3), NOW)).toBe("Baru saja");
    expect(formatRelativeTime(ago(-5e3), NOW)).toBe("Baru saja");
    expect(formatRelativeTime(ago(60e3), NOW)).toBe("1 menit lalu");
    expect(formatRelativeTime(ago(59 * 60e3), NOW)).toBe("59 menit lalu");
    expect(formatRelativeTime(ago(3 * 3600e3 + 59 * 60e3), NOW)).toBe("3 jam lalu");
    expect(formatRelativeTime(ago(2 * 86400e3), NOW)).toBe("2 hari lalu");
  });
  it("7 hari atau lebih -> tanggal WIB", () => {
    expect(formatRelativeTime("2026-11-05T20:00:00Z", NOW)).toBe("6 Nov 2026");
  });
});
