import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "kk_skenario" && jar.value ? { name: n, value: jar.value } : undefined) }),
}));

const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/lib/session", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/lib/merchant-api", () => ({ merchantFetch: (...a: unknown[]) => merchantFetch(...a) }));
import { adjustQuota, requestUpload, saveMenu, setMenuActive } from "./menus";

const ok = { name: "Nasi Box", category_id: 1, description: "", image_url: null, unit_label: "porsi", price: 15000, hpp: 9000, daily_quota: 20, prep_minutes: 15, is_preorder: false, preorder_days: 0, min_order_qty: 1, options: [] };
const set = (v?: string) => { vi.stubEnv("NODE_ENV", "development"); jar.value = v; };
const body = (i = 0) => JSON.parse(merchantFetch.mock.calls[i][1].body);
beforeEach(() => {
  merchantFetch.mockReset();
  merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { id: 5, name: "Dari Server" } });
});
afterEach(() => { vi.unstubAllEnvs(); jar.value = undefined; requireMerchant.mockClear(); });

describe("saveMenu (M-07, FE-02, FE-03)", () => {
  it("MF-E4 input tidak valid -> VALIDATION_ERROR lokal, server tidak dipanggil", async () => {
    const r = await saveMenu(null, { ...ok, price: 9000, hpp: 9000, name: "" });
    expect("error" in r && r.error.code).toBe("VALIDATION_ERROR");
    expect("error" in r && r.error.fields?.price?.[0]).toContain("lebih besar dari HPP");
    expect("error" in r && r.error.fields?.name).toBeTruthy();
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("input bukan objek (null, string) -> VALIDATION_ERROR, tidak melempar", async () => {
    for (const x of [null, undefined, "x"]) {
      const r = await saveMenu(null, x);
      expect("error" in r && r.error.code).toBe("VALIDATION_ERROR");
    }
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("menu baru -> POST /menus sekali, body hasil parse (teks di-trim)", async () => {
    const r = await saveMenu(null, { ...ok, name: "  Nasi Box  " });
    expect(merchantFetch).toHaveBeenCalledTimes(1);
    expect(merchantFetch.mock.calls[0][0]).toBe("/menus");
    expect(merchantFetch.mock.calls[0][1].method).toBe("POST");
    expect(body().name).toBe("Nasi Box");
    expect(r).toEqual({ data: { id: 5, name: "Dari Server" } });
  });
  it("ubah -> PATCH /menus/5, tidak pernah POST (FE-02)", async () => {
    await saveMenu(5, ok);
    expect(merchantFetch).toHaveBeenCalledTimes(1);
    expect(merchantFetch.mock.calls[0][0]).toBe("/menus/5");
    expect(merchantFetch.mock.calls[0][1].method).toBe("PATCH");
  });
  it("galat backend diteruskan: 400 fields.price (FE-03) dan 404", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 400, error: { code: "VALIDATION_ERROR", message: "x", fields: { price: ["Dari server"] } } });
    expect(await saveMenu(5, ok)).toEqual({ error: { code: "VALIDATION_ERROR", message: "x", fields: { price: ["Dari server"] } } });
    merchantFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "Menu tidak ditemukan." } });
    const r = await saveMenu(999, ok);
    expect("error" in r && r.error.code).toBe("NOT_FOUND");
  });
  it("skenario gagal-aksi -> INTERNAL_ERROR tanpa memanggil server", async () => {
    set("gagal-aksi");
    const r = await saveMenu(null, ok);
    expect("error" in r && r.error.code).toBe("INTERNAL_ERROR");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("memanggil requireMerchant lebih dulu", async () => {
    await saveMenu(null, ok);
    expect(requireMerchant).toHaveBeenCalled();
  });
});

describe("adjustQuota (M-05, FE-03)", () => {
  it("PATCH /menus/3/quota dengan body apa adanya", async () => {
    await adjustQuota(3, { quota_today: 7 });
    expect(merchantFetch.mock.calls[0][0]).toBe("/menus/3/quota");
    expect(merchantFetch.mock.calls[0][1].method).toBe("PATCH");
    expect(body()).toEqual({ quota_today: 7 });
    await adjustQuota(3, { delta: -1 });
    expect(body(1)).toEqual({ delta: -1 });
  });
  it("409 backend diteruskan dengan pesan backend", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 409, error: { code: "CONFLICT", message: "Kuota tidak bisa di bawah porsi yang sudah dipesan (4)." } });
    expect(await adjustQuota(3, { delta: -9 })).toEqual({ error: { code: "CONFLICT", message: "Kuota tidak bisa di bawah porsi yang sudah dipesan (4)." } });
  });
  it("bentuk tak valid -> lokal, server tidak dipanggil", async () => {
    for (const x of [null, {}, { delta: "1" }]) {
      const r = await adjustQuota(3, x as never);
      expect("error" in r && r.error.code).toBe("VALIDATION_ERROR");
    }
    const r = await adjustQuota(1.5, { delta: 1 });
    expect("error" in r).toBe(true);
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("skenario gagal-aksi dan konflik tetap berlaku", async () => {
    set("gagal-aksi");
    expect(await adjustQuota(3, { delta: 1 })).toMatchObject({ error: { code: "INTERNAL_ERROR" } });
    set("konflik");
    expect(await adjustQuota(3, { delta: 1 })).toMatchObject({ error: { code: "CONFLICT" } });
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("memanggil requireMerchant lebih dulu", async () => {
    await adjustQuota(3, { delta: 1 });
    expect(requireMerchant).toHaveBeenCalled();
  });
});

describe("id bukan bilangan bulat positif ditolak sebelum membangun path", () => {
  it("saveMenu dan setMenuActive dengan '../profile', 0, -1, 1.5", async () => {
    for (const id of ["../profile", 0, -1, 1.5, Number.NaN]) {
      expect(await saveMenu(id as never, ok)).toMatchObject({ error: { code: "NOT_FOUND" } });
      expect(await setMenuActive(id as never, true)).toMatchObject({ error: { code: "NOT_FOUND" } });
    }
    expect(await adjustQuota(0, { delta: 1 })).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});

describe("setMenuActive (M-07)", () => {
  it("PATCH /menus/3 body { is_active }", async () => {
    await setMenuActive(3, false);
    expect(merchantFetch.mock.calls[0][0]).toBe("/menus/3");
    expect(merchantFetch.mock.calls[0][1].method).toBe("PATCH");
    expect(body()).toEqual({ is_active: false });
  });
  it("gagal-aksi -> INTERNAL_ERROR; requireMerchant dipanggil", async () => {
    await setMenuActive(3, true);
    expect(requireMerchant).toHaveBeenCalled();
    set("gagal-aksi");
    expect(await setMenuActive(3, true)).toMatchObject({ error: { code: "INTERNAL_ERROR" } });
  });
});

describe("requestUpload (M-07, M-10, FE-08)", () => {
  const berkas = { purpose: "menu" as const, content_type: "image/png", size: 10 };
  it("POST /uploads dengan body apa adanya; data backend diteruskan", async () => {
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { upload_url: "u", public_url: "p", expires_at: "e" } });
    expect(await requestUpload(berkas)).toEqual({ data: { upload_url: "u", public_url: "p", expires_at: "e" } });
    expect(merchantFetch.mock.calls[0][0]).toBe("/uploads");
    expect(merchantFetch.mock.calls[0][1].method).toBe("POST");
    expect(body()).toEqual(berkas);
    expect(requireMerchant).toHaveBeenCalled();
  });
  it("503 backend -> pesan backend", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 503, error: { code: "SERVICE_UNAVAILABLE", message: "Unggah foto belum tersedia. Coba lagi nanti." } });
    expect(await requestUpload(berkas)).toEqual({ error: { code: "SERVICE_UNAVAILABLE", message: "Unggah foto belum tersedia. Coba lagi nanti." } });
  });
  it("gagal-aksi -> error tanpa memanggil server (MF-E3)", async () => {
    set("gagal-aksi");
    expect("error" in (await requestUpload(berkas))).toBe(true);
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});
