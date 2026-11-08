import { describe, expect, it } from "vitest";
import { promos } from "./fixtures/promos";
import { PROMO_STATUS, promoStatus, teksJenis } from "./promo-status";
import type { Promo } from "@/types/promo";

const NOW = Date.parse("2026-10-31T00:00:00Z");
const dasar: Promo = { id: 1, code: "A", description: null, type: "percent", value: 10, max_discount: null, min_subtotal: 0, quota: 10, used_count: 0, per_user_limit: 1, starts_at: "2026-10-01T00:00:00Z", ends_at: "2026-11-30T00:00:00Z", is_active: true };
const st = (p: Partial<Promo>) => promoStatus({ ...dasar, ...p }, NOW);

describe("promoStatus (PR-N1)", () => {
  it("urutan: nonaktif > terjadwal > berakhir > kuota habis > berjalan", () => {
    expect(st({})).toBe("berjalan");
    expect(st({ is_active: false, starts_at: "2026-12-01T00:00:00Z" })).toBe("nonaktif");
    expect(st({ starts_at: "2026-11-05T00:00:00Z", used_count: 10 })).toBe("terjadwal");
    expect(st({ ends_at: "2026-10-20T00:00:00Z", used_count: 10 })).toBe("berakhir");
    expect(st({ used_count: 10 })).toBe("kuota-habis");
    expect(st({ used_count: 11 })).toBe("kuota-habis");
    expect(st({ quota: null, used_count: 999 })).toBe("berjalan");
  });
  it("label dan ikon untuk tiap status", () => {
    expect(Object.values(PROMO_STATUS).map((s) => s.label)).toEqual(["Nonaktif", "Terjadwal", "Berakhir", "Kuota habis", "Aktif"]);
    Object.values(PROMO_STATUS).forEach((s) => expect(s.icon).toBeTruthy());
  });
  it("fixtures mencakup empat status", () => {
    expect(promos().map((p) => promoStatus(p)).sort()).toEqual(["berakhir", "berjalan", "nonaktif", "terjadwal"]);
  });
});

describe("teksJenis", () => {
  it("persen, potongan, gratis biaya layanan", () => {
    expect(teksJenis({ ...dasar, value: 10, max_discount: 5000 })).toBe("Diskon 10% maks Rp 5.000");
    expect(teksJenis({ ...dasar, value: 10 })).toBe("Diskon 10%");
    expect(teksJenis({ ...dasar, type: "fixed", value: 3000 })).toBe("Potongan Rp 3.000");
    expect(teksJenis({ ...dasar, type: "free_service_fee", value: 0 })).toBe("Gratis biaya layanan");
  });
});
