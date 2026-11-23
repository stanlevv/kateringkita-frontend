import { describe, expect, it } from "vitest";
import type { Banner } from "@/types/banner";
import { isBannerActive, validateBanner, bannerStatus } from "./banner";

const NOW = Date.parse("2026-11-17T05:00:00Z");
const makeBanner = (overrides: Partial<Banner>): Banner => ({
  id: 1,
  title: "Promo",
  image_url: "https://foto.test/x.png",
  target: "merchant",
  promo: null,
  merchant: null,
  status: "disetujui",
  catatan: null,
  starts_at: "2026-11-16T00:00:00.000Z",
  ends_at: "2026-11-20T00:00:00.000Z",
  sort_order: 0,
  reviewed_at: null,
  created_at: "2026-11-16T00:00:00.000Z",
  ...overrides,
});

describe("statusBanner", () => {
  it("label & nada sesuai status dan periode", () => {
    expect(bannerStatus(makeBanner({}), NOW).label).toBe("Tayang");
    expect(bannerStatus(makeBanner({ starts_at: "2026-11-18T00:00:00.000Z" }), NOW).label).toBe("Terjadwal");
    expect(bannerStatus(makeBanner({ ends_at: "2026-11-17T00:00:00.000Z" }), NOW).label).toBe("Berakhir");
    expect(bannerStatus(makeBanner({ status: "menunggu" }), NOW)).toMatchObject({
      label: "Menunggu persetujuan",
      tone: "warning",
    });
    expect(bannerStatus(makeBanner({ status: "ditolak" }), NOW)).toMatchObject({ label: "Ditolak", tone: "danger" });
    expect(bannerStatus(makeBanner({ status: "nonaktif" }), NOW).label).toBe("Nonaktif");
  });
  it("aktif = menunggu/disetujui yang belum berakhir", () => {
    expect(isBannerActive(makeBanner({}), NOW)).toBe(true);
    expect(isBannerActive(makeBanner({ status: "menunggu" }), NOW)).toBe(true);
    expect(isBannerActive(makeBanner({ status: "ditolak" }), NOW)).toBe(false);
    expect(isBannerActive(makeBanner({ ends_at: "2026-11-17T00:00:00.000Z" }), NOW)).toBe(false);
  });
});

describe("cekBanner", () => {
  const ok = {
    title: "Diskon",
    image_url: "https://foto.test/x.png",
    target: "merchant",
    promo_id: null,
    starts_at: "2026-11-17T00:00:00.000Z",
    ends_at: "2026-11-20T00:00:00.000Z",
  };
  it("valid → kosong; galat per kolom", () => {
    expect(validateBanner(ok)).toEqual({});
    expect(
      validateBanner({ ...ok, title: "ab", image_url: "", target: "promo", ends_at: "2026-11-16T00:00:00.000Z" }),
    ).toEqual({
      title: "Judul 3–80 karakter.",
      image_url: "Unggah gambar banner.",
      promo_id: "Pilih voucher.",
      ends_at: "Waktu selesai harus setelah waktu mulai.",
    });
  });
});
