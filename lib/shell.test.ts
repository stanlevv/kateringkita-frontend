import { describe, expect, it } from "vitest";
import {
  isOutsideOpenHours,
  formatDayTime,
  initials,
  openHoursLabel,
  parseSidebarMode,
  countNeedsAction,
} from "./shell";

describe("SH-N1 mode sidebar dari cookie", () => {
  it("hanya 'ringkas' yang menciutkan; kosong/asing = lebar", () => {
    expect(parseSidebarMode("ringkas")).toBe("ringkas");
    expect(parseSidebarMode("lebar")).toBe("lebar");
    expect(parseSidebarMode(undefined)).toBe("lebar");
    expect(parseSidebarMode("<script>")).toBe("lebar");
  });
});

// 2026-10-31 04:42Z = 11.42 WIB (Sabtu)
const MIDDAY = Date.parse("2026-10-31T04:42:00Z");

describe("SH-N1 badge perlu tindakan", () => {
  it("menghitung holding dan confirmed saja", () => {
    const orders = ["holding", "confirmed", "cooking", "ready", "completed", "holding"].map((status) => ({
      status,
      payment_method: "cod",
      payment_status: "unpaid",
    }));
    expect(countNeedsAction(orders as never)).toBe(3);
    expect(countNeedsAction([])).toBe(0);
  });
  it("F26: VA/online belum lunas tidak dihitung (diterima otomatis setelah lunas)", () => {
    const makeOrder = (payment_method: string, payment_status: string) => ({
      status: "holding",
      payment_method,
      payment_status,
    });
    expect(countNeedsAction([makeOrder("va", "unpaid"), makeOrder("online", "pending")] as never)).toBe(0);
    expect(countNeedsAction([makeOrder("online", "paid"), makeOrder("cod", "unpaid")] as never)).toBe(2);
  });
});

describe("SH-A1 di luar jam buka", () => {
  it("di dalam rentang -> false", () => expect(isOutsideOpenHours(MIDDAY, "07:00", "16:00")).toBe(false));
  it("sebelum buka -> true", () =>
    expect(isOutsideOpenHours(Date.parse("2026-10-30T22:30:00Z"), "07:00", "16:00")).toBe(true)); // 05.30 WIB
  it("tepat jam tutup -> true", () =>
    expect(isOutsideOpenHours(Date.parse("2026-10-31T09:00:00Z"), "07:00", "16:00")).toBe(true));
  it("lewat tengah malam (18.00–02.00)", () => {
    const wib = (hour: number) => Date.parse("2026-10-31T00:00:00Z") + (hour - 7) * 3600e3;
    expect(isOutsideOpenHours(wib(23), "18:00", "02:00")).toBe(false);
    expect(isOutsideOpenHours(wib(1), "18:00", "02:00")).toBe(false);
    expect(isOutsideOpenHours(wib(2), "18:00", "02:00")).toBe(true);
    expect(isOutsideOpenHours(wib(12), "18:00", "02:00")).toBe(true);
    expect(isOutsideOpenHours(wib(18), "18:00", "02:00")).toBe(false);
  });
  it("label", () => expect(openHoursLabel("07:00", "16:00")).toBe("07.00–16.00"));
});

describe("SH-N2 jam & inisial", () => {
  it("format hari jam WIB", () => expect(formatDayTime(MIDDAY)).toBe("Sab, 31 Okt · 11.42 WIB"));
  it("inisial", () => {
    expect(initials("Rohan Rifqi")).toBe("RR");
    expect(initials("Budi")).toBe("B");
    expect(initials("")).toBe("?");
  });
});
