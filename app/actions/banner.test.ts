import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMerchant = vi.fn();
const requireAdmin = vi.fn();
const merchantFetch = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/authService", () => ({
  requireMerchant: (...a: unknown[]) => requireMerchant(...a),
  requireAdmin: (...a: unknown[]) => requireAdmin(...a),
}));
vi.mock("@/services/api", async (orig) => ({
  ...(await orig<typeof import("@/services/api")>()),
  merchantFetch: (...a: unknown[]) => merchantFetch(...a),
  adminFetch: (...a: unknown[]) => adminFetch(...a),
}));
import { hapusBannerToko, simpanBannerToko } from "./banner";
import { buatBannerAdmin, mintaUnggahAdmin, tinjauBannerAdmin } from "./admin/banner";

const ISI = {
  title: "Diskon",
  image_url: "https://foto.test/a.webp",
  target: "merchant",
  promo_id: null,
  starts_at: "2026-11-17T00:00:00.000Z",
  ends_at: "2026-11-20T00:00:00.000Z",
};

beforeEach(() => {
  requireMerchant.mockReset().mockResolvedValue({});
  requireAdmin.mockReset().mockResolvedValue({});
  merchantFetch.mockReset().mockResolvedValue({ ok: true, status: 201, data: { id: 9 } });
  adminFetch.mockReset().mockResolvedValue({ ok: true, status: 200, data: { id: 9 } });
});

describe("banner penjual", () => {
  it("baru → POST, ubah → PATCH; isian tidak valid tanpa panggilan", async () => {
    expect(await simpanBannerToko(null, ISI)).toEqual({ data: { id: 9 } });
    expect(merchantFetch).toHaveBeenLastCalledWith("/banners", { method: "POST", body: JSON.stringify(ISI) });
    await simpanBannerToko(9, ISI);
    expect(merchantFetch).toHaveBeenLastCalledWith("/banners/9", { method: "PATCH", body: JSON.stringify(ISI) });
    expect(await simpanBannerToko(null, { ...ISI, title: "" })).toMatchObject({
      error: { code: "VALIDATION_ERROR", fields: { title: ["Judul 3–80 karakter."] } },
    });
    expect(merchantFetch).toHaveBeenCalledTimes(2);
    await hapusBannerToko(9);
    expect(merchantFetch).toHaveBeenLastCalledWith("/banners/9", { method: "DELETE" });
  });
});

describe("banner admin", () => {
  it("super & ops; buat, tinjau (tolak wajib alasan), minta unggah ke folder platform", async () => {
    await buatBannerAdmin(null, { ...ISI, target: "none", sort_order: 1 });
    expect(requireAdmin).toHaveBeenCalledWith("super", "ops");
    expect(adminFetch).toHaveBeenLastCalledWith("/banners", {
      method: "POST",
      body: JSON.stringify({ ...ISI, target: "none", sort_order: 1 }),
    });
    expect(await tinjauBannerAdmin(9, { status: "ditolak" })).toMatchObject({
      error: { fields: { catatan: ["Tulis alasan penolakan (3–300 karakter)."] } },
    });
    await tinjauBannerAdmin(9, { status: "ditolak", catatan: "Gambar buram" });
    expect(adminFetch).toHaveBeenLastCalledWith("/banners/9", {
      method: "PATCH",
      body: JSON.stringify({ status: "ditolak", catatan: "Gambar buram" }),
    });
    await mintaUnggahAdmin({ purpose: "banner", content_type: "image/png", size: 10 });
    expect(adminFetch).toHaveBeenLastCalledWith("/uploads", {
      method: "POST",
      body: JSON.stringify({ purpose: "banner", content_type: "image/png", size: 10 }),
    });
  });
});
