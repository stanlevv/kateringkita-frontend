import { describe, expect, it } from "vitest";
import type { Banner } from "@/types/banner";
import { bannerAktif, cekBanner, statusBanner } from "./banner";

const NOW = Date.parse("2026-11-17T05:00:00Z");
const b = (p: Partial<Banner>): Banner => ({
  id: 1, title: "Promo", image_url: "https://foto.test/x.png", target: "merchant", promo: null, merchant: null, status: "disetujui", catatan: null,
  starts_at: "2026-11-16T00:00:00.000Z", ends_at: "2026-11-20T00:00:00.000Z", sort_order: 0, reviewed_at: null, created_at: "2026-11-16T00:00:00.000Z", ...p,
});

describe("statusBanner", () => {
  it("label & nada sesuai status dan periode", () => {
    expect(statusBanner(b({}), NOW).label).toBe("Tayang");
    expect(statusBanner(b({ starts_at: "2026-11-18T00:00:00.000Z" }), NOW).label).toBe("Terjadwal");
    expect(statusBanner(b({ ends_at: "2026-11-17T00:00:00.000Z" }), NOW).label).toBe("Berakhir");
    expect(statusBanner(b({ status: "menunggu" }), NOW)).toMatchObject({ label: "Menunggu persetujuan", tone: "warning" });
    expect(statusBanner(b({ status: "ditolak" }), NOW)).toMatchObject({ label: "Ditolak", tone: "danger" });
    expect(statusBanner(b({ status: "nonaktif" }), NOW).label).toBe("Nonaktif");
  });
  it("aktif = menunggu/disetujui yang belum berakhir", () => {
    expect(bannerAktif(b({}), NOW)).toBe(true);
    expect(bannerAktif(b({ status: "menunggu" }), NOW)).toBe(true);
    expect(bannerAktif(b({ status: "ditolak" }), NOW)).toBe(false);
    expect(bannerAktif(b({ ends_at: "2026-11-17T00:00:00.000Z" }), NOW)).toBe(false);
  });
});

describe("cekBanner", () => {
  const ok = { title: "Diskon", image_url: "https://foto.test/x.png", target: "merchant", promo_id: null, starts_at: "2026-11-17T00:00:00.000Z", ends_at: "2026-11-20T00:00:00.000Z" };
  it("valid → kosong; galat per kolom", () => {
    expect(cekBanner(ok)).toEqual({});
    expect(cekBanner({ ...ok, title: "ab", image_url: "", target: "promo", ends_at: "2026-11-16T00:00:00.000Z" })).toEqual({
      title: "Judul 3–80 karakter.", image_url: "Unggah gambar banner.", promo_id: "Pilih voucher.", ends_at: "Waktu selesai harus setelah waktu mulai.",
    });
  });
});
