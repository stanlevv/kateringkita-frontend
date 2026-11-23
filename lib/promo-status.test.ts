// Test status voucher dan teks jenis potongan.
import { describe, expect, it } from "vitest";
import { promos } from "./fixtures/promos";
import { PROMO_STATUS, promoStatus, describePromoType } from "./promo-status";
import type { Promo } from "@/types/promo";

const NOW = Date.parse("2026-10-31T00:00:00Z");
const base: Promo = {
  id: 1,
  code: "A",
  description: null,
  type: "percent",
  value: 10,
  max_discount: null,
  min_subtotal: 0,
  quota: 10,
  used_count: 0,
  per_user_limit: 1,
  starts_at: "2026-10-01T00:00:00Z",
  ends_at: "2026-11-30T00:00:00Z",
  is_active: true,
  is_public: true,
};
const statusOf = (overrides: Partial<Promo>) => promoStatus({ ...base, ...overrides }, NOW);

describe("promoStatus (PR-N1)", () => {
  it("urutan: nonaktif > terjadwal > berakhir > kuota habis > berjalan", () => {
    expect(statusOf({})).toBe("berjalan");
    expect(statusOf({ is_active: false, starts_at: "2026-12-01T00:00:00Z" })).toBe("nonaktif");
    expect(statusOf({ starts_at: "2026-11-05T00:00:00Z", used_count: 10 })).toBe("terjadwal");
    expect(statusOf({ ends_at: "2026-10-20T00:00:00Z", used_count: 10 })).toBe("berakhir");
    expect(statusOf({ used_count: 10 })).toBe("kuota-habis");
    expect(statusOf({ used_count: 11 })).toBe("kuota-habis");
    expect(statusOf({ quota: null, used_count: 999 })).toBe("berjalan");
  });
  it("label dan ikon untuk tiap status", () => {
    expect(Object.values(PROMO_STATUS).map((status) => status.label)).toEqual([
      "Nonaktif",
      "Terjadwal",
      "Berakhir",
      "Kuota habis",
      "Aktif",
    ]);
    Object.values(PROMO_STATUS).forEach((status) => expect(status.icon).toBeTruthy());
  });
  it("fixtures mencakup empat status", () => {
    expect(
      promos()
        .map((promo) => promoStatus(promo))
        .sort(),
    ).toEqual(["berakhir", "berjalan", "nonaktif", "terjadwal"]);
  });
});

describe("describePromoType", () => {
  it("persen, potongan, gratis biaya layanan", () => {
    expect(describePromoType({ ...base, value: 10, max_discount: 5000 })).toBe("Diskon 10% maks Rp 5.000");
    expect(describePromoType({ ...base, value: 10 })).toBe("Diskon 10%");
    expect(describePromoType({ ...base, type: "fixed", value: 3000 })).toBe("Potongan Rp 3.000");
    expect(describePromoType({ ...base, type: "free_service_fee", value: 0 })).toBe("Gratis biaya layanan");
  });
});
