// Test server action arsip konten admin (F33): arsip/pulihkan pop-up, banner, dan promo platform, serta ubah isi banner
// platform. Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn<(...levels: string[]) => Promise<object>>(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireAdmin: (...levels: string[]) => requireAdmin(...levels) }));
const adminFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
import { setAdminBannerArchived, updateAdminBannerContent } from "./banner";
import { setPopupArchived } from "./popup";
import { setPlatformPromoArchived } from "./promos";

const bannerInput = {
  title: "  Promo akhir pekan ",
  image_url: "https://foto.test/platform/banner/a.webp",
  target: "none",
  promo_id: null,
  starts_at: "2026-11-20T00:00:00.000Z",
  ends_at: "2026-11-27T00:00:00.000Z",
  sort_order: 2,
};

beforeEach(() => {
  adminFetch.mockReset().mockResolvedValue({ ok: true, status: 200, data: { id: 1 } });
  requireAdmin.mockClear();
});

describe("arsip dan pulihkan konten", () => {
  it("arsip -> POST …/archive, pulihkan -> POST …/restore, hanya super dan ops", async () => {
    expect(await setPopupArchived(3, true)).toEqual({ data: { id: 1 } });
    expect(adminFetch).toHaveBeenLastCalledWith("/popups/3/archive", { method: "POST" });
    await setPopupArchived(3, false);
    expect(adminFetch).toHaveBeenLastCalledWith("/popups/3/restore", { method: "POST" });
    await setAdminBannerArchived(4, true);
    expect(adminFetch).toHaveBeenLastCalledWith("/banners/4/archive", { method: "POST" });
    await setPlatformPromoArchived(5, false);
    expect(adminFetch).toHaveBeenLastCalledWith("/promos/5/restore", { method: "POST" });
    for (const call of requireAdmin.mock.calls) expect(call).toEqual(["super", "ops"]);
  });

  it("id tidak valid -> galat tanpa memanggil backend", async () => {
    expect(await setPopupArchived(0, true)).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(await setAdminBannerArchived(-1, true)).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(await setPlatformPromoArchived(1.5, true)).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it("409 dari backend diteruskan apa adanya", async () => {
    const message = "Promo masih dipakai di pop-up atau banner: Promo akhir pekan.";
    adminFetch.mockResolvedValue({ ok: false, status: 409, error: { code: "PROMO_IN_USE", message } });
    expect(await setPlatformPromoArchived(5, true)).toEqual({ error: { code: "PROMO_IN_USE", message } });
  });
});

describe("ubah isi banner platform", () => {
  it("PATCH /banners/:id/content dengan judul dirapikan", async () => {
    await updateAdminBannerContent(7, bannerInput);
    expect(adminFetch).toHaveBeenCalledWith("/banners/7/content", {
      method: "PATCH",
      body: JSON.stringify({ ...bannerInput, title: "Promo akhir pekan" }),
    });
    expect(requireAdmin).toHaveBeenCalledWith("super", "ops");
  });

  it("id kosong atau isian salah -> galat tanpa memanggil backend", async () => {
    expect(await updateAdminBannerContent(null, bannerInput)).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(await updateAdminBannerContent(7, { ...bannerInput, title: "x" })).toMatchObject({
      error: { fields: { title: expect.any(Array) } },
    });
    expect(adminFetch).not.toHaveBeenCalled();
  });
});
