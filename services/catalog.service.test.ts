// Test service katalog publik: path yang dipanggil dan penerusan galat.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api", async () => {
  const actual = await vi.importActual<typeof import("@/services/api")>("@/services/api").catch(() => null);
  return { apiFetch: vi.fn(), toResult: actual?.toResult };
});

import { apiFetch } from "@/services/api";
import { getMerchantBySlug, getMerchantMenus, getPublicMerchants } from "@/services/catalog.service";

const mocked = vi.mocked(apiFetch);

beforeEach(() => mocked.mockReset());

describe("catalog.service", () => {
  it("getPublicMerchants memanggil /merchants", async () => {
    mocked.mockResolvedValue({ ok: true, status: 200, data: [] });
    expect(await getPublicMerchants()).toEqual({ data: [] });
    expect(mocked).toHaveBeenCalledWith("/merchants");
  });
  it("getPublicMerchants(3) menyaring per titik ambil", async () => {
    mocked.mockResolvedValue({ ok: true, status: 200, data: [] });
    await getPublicMerchants(3);
    expect(mocked).toHaveBeenCalledWith("/merchants?pickup_point_id=3");
  });
  it("getMerchantBySlug memanggil /merchants/<slug>", async () => {
    mocked.mockResolvedValue({ ok: true, status: 200, data: { slug: "dapur-bu-sri" } as never });
    await getMerchantBySlug("dapur-bu-sri");
    expect(mocked).toHaveBeenCalledWith("/merchants/dapur-bu-sri");
  });
  it("getMerchantMenus meng-encode slug dan mengembalikan array menu", async () => {
    mocked.mockResolvedValue({
      ok: true,
      status: 200,
      data: [{ id: 1 }] as never,
      meta: { page: 1, limit: 100, total: 1 },
    });
    expect(await getMerchantMenus("a b")).toEqual({ data: [{ id: 1 }] });
    expect(mocked).toHaveBeenCalledWith("/menus?merchant=a%20b&limit=100");
  });
  it("meneruskan galat 404", async () => {
    mocked.mockResolvedValue({
      ok: false,
      status: 404,
      error: { code: "NOT_FOUND", message: "Toko tidak ditemukan." },
    });
    expect(await getMerchantBySlug("x")).toEqual({ error: { code: "NOT_FOUND", message: "Toko tidak ditemukan." } });
  });
});
