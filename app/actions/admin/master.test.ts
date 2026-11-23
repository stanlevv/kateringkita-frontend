// Test server action data master (master.ts) serta promo platform dan biaya layanan (promos.ts) di app/actions/admin.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
import { setMasterActive, saveMaster, swapSortOrder } from "./master";
import { setPlatformPromoActive, saveServiceFee, savePlatformPromo } from "./promos";

const okResponse = (data: unknown = {}) => ({ ok: true, status: 200, data });
const validPromo = {
  code: "ramadan",
  description: "",
  type: "percent",
  value: 10,
  max_discount: null,
  min_subtotal: 0,
  quota: null,
  per_user_limit: 1,
  starts_at: "2026-11-01T00:00:00.000Z",
  ends_at: "2026-12-01T00:00:00.000Z",
  is_active: true,
};

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset().mockResolvedValue(okResponse());
});

describe("requireAdmin di semua action admin (A-01…A-04)", () => {
  it("menolak -> backend tidak dipanggil", async () => {
    requireAdmin.mockRejectedValue(new Error("404"));
    const allActions = [
      () => saveMaster("categories", null, { name: "a" }),
      () => setMasterActive("categories", 1, true),
      () => swapSortOrder("categories", { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }),
      () => savePlatformPromo(null, validPromo),
      () => setPlatformPromoActive(1, true),
      () => saveServiceFee(1000),
    ];
    for (const action of allActions) await expect(action()).rejects.toThrow();
    expect(adminFetch).not.toHaveBeenCalled();
  });
});

describe("master", () => {
  it("kind di luar whitelist, id tak valid, nama kosong/terlalu panjang ditolak tanpa panggilan", async () => {
    for (const result of [
      await saveMaster("users", null, { name: "a" }),
      await saveMaster("toString", null, { name: "a" }),
      await saveMaster("categories", 0, { name: "a" }),
      await setMasterActive("categories", 1.5, true),
      await saveMaster("categories", null, { name: "  " }),
      await saveMaster("categories", null, { name: "x".repeat(61) }),
      await saveMaster("categories", null, { name: "a", icon: "x".repeat(41) }),
      await saveMaster("pickup-points", null, { name: "a", description: "x".repeat(256) }),
      await saveMaster("merchant-types", null, { name: "x".repeat(101) }),
    ])
      expect("error" in result && result.error.code).toBe("VALIDATION_ERROR");
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("whitelist kind: setAktifMaster, tukarUrutan, simpanMaster tanpa panggilan dan tanpa isi field", async () => {
    const first = { id: 1, sort_order: 1 },
      second = { id: 2, sort_order: 2 };
    const activeResult = await setMasterActive("users", 1, true);
    const swapResult = await swapSortOrder("users", first, second);
    const saveResult = await saveMaster("users", null, { name: "a" }); // validateMaster sendiri memberi fields; penjaga kind (jenis data) tidak
    for (const result of [activeResult, swapResult, saveResult])
      expect("error" in result && result.error.code).toBe("VALIDATION_ERROR");
    expect("error" in saveResult && saveResult.error.fields).toBeUndefined();
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("tukarUrutan: sort_order negatif/pecahan/sama dan id tak valid ditolak", async () => {
    for (const [first, second] of [
      [
        { id: 1, sort_order: -1 },
        { id: 2, sort_order: 2 },
      ],
      [
        { id: 1, sort_order: 1 },
        { id: 2, sort_order: -2 },
      ],
      [
        { id: 1, sort_order: 1.5 },
        { id: 2, sort_order: 2 },
      ],
      [
        { id: 1, sort_order: 3 },
        { id: 2, sort_order: 3 },
      ],
      [
        { id: 0, sort_order: 1 },
        { id: 2, sort_order: 2 },
      ],
      [
        { id: 1, sort_order: 1 },
        { id: -2, sort_order: 2 },
      ],
    ])
      expect("error" in (await swapSortOrder("categories", first, second))).toBe(true);
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("buat dan ubah mengirim field milik jenisnya saja", async () => {
    await saveMaster("pickup-points", null, { name: " Kantin ", description: " ", icon: "x" });
    expect(adminFetch).toHaveBeenLastCalledWith("/master/pickup-points", {
      method: "POST",
      body: JSON.stringify({ name: "Kantin", description: null }),
    });
    await saveMaster("merchant-types", 4, { name: "Warung" });
    expect(adminFetch).toHaveBeenLastCalledWith("/master/merchant-types/4", {
      method: "PATCH",
      body: JSON.stringify({ name: "Warung" }),
    });
  });
  it("409 diteruskan apa adanya", async () => {
    const message = "Titik temu ini satu-satunya untuk toko: Dapur Ibu.";
    adminFetch.mockResolvedValue({ ok: false, status: 409, error: { code: "CONFLICT", message } });
    const result = await setMasterActive("pickup-points", 2, false);
    expect("error" in result && result.error.message).toBe(message);
    expect(adminFetch).toHaveBeenCalledWith("/master/pickup-points/2/deactivate", { method: "POST" });
  });
  it("tukar urutan: dua PATCH dengan nilai bertukar", async () => {
    const result = await swapSortOrder("categories", { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 });
    expect(result).toEqual({ data: null });
    expect(adminFetch).toHaveBeenCalledTimes(2);
    expect(adminFetch).toHaveBeenNthCalledWith(1, "/master/categories/1", {
      method: "PATCH",
      body: JSON.stringify({ sort_order: 2 }),
    });
    expect(adminFetch).toHaveBeenNthCalledWith(2, "/master/categories/2", {
      method: "PATCH",
      body: JSON.stringify({ sort_order: 1 }),
    });
  });
  it("tukar urutan: PATCH kedua gagal -> yang pertama dikembalikan + galat", async () => {
    adminFetch
      .mockResolvedValueOnce(okResponse())
      .mockResolvedValueOnce({ ok: false, status: 500, error: { code: "X", message: "gagal" } })
      .mockResolvedValueOnce(okResponse());
    const result = await swapSortOrder("merchant-types", { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 });
    expect("error" in result).toBe(true);
    expect(adminFetch).toHaveBeenCalledTimes(3);
    expect(adminFetch).toHaveBeenNthCalledWith(3, "/master/merchant-types/1", {
      method: "PATCH",
      body: JSON.stringify({ sort_order: 1 }),
    });
  });
  it("tukar urutan ditolak untuk titik temu dan id sama", async () => {
    expect("error" in (await swapSortOrder("pickup-points", { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }))).toBe(
      true,
    );
    expect("error" in (await swapSortOrder("categories", { id: 1, sort_order: 1 }, { id: 1, sort_order: 1 }))).toBe(
      true,
    );
    expect(adminFetch).not.toHaveBeenCalled();
  });
});

describe("promo platform & biaya", () => {
  it("validasi sama dengan penjual; buat mengirim kode, ubah tanpa kode", async () => {
    const invalidResult = await savePlatformPromo(null, { ...validPromo, value: 0 });
    expect("error" in invalidResult && invalidResult.error.fields?.value).toBeTruthy();
    expect(adminFetch).not.toHaveBeenCalled();
    adminFetch.mockResolvedValue(okResponse({ id: 5, is_active: true }));
    await savePlatformPromo(null, validPromo);
    const createdBody = JSON.parse(adminFetch.mock.calls[0][1].body);
    expect(createdBody.code).toBe("RAMADAN");
    expect(createdBody.starts_at).toBe("2026-11-01T00:00:00.000Z");
    await savePlatformPromo(5, validPromo);
    expect(adminFetch.mock.calls[1][0]).toBe("/promos/5");
    expect(JSON.parse(adminFetch.mock.calls[1][1].body).code).toBeUndefined();
  });
  it("buat promo = tepat satu panggilan backend, tanpa is_active", async () => {
    adminFetch.mockResolvedValue(okResponse({ id: 5, is_active: true }));
    await savePlatformPromo(null, { ...validPromo, is_active: false });
    expect(adminFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(adminFetch.mock.calls[0][1].body).is_active).toBeUndefined();
  });
  it("409 kode ganda diteruskan dengan fields", async () => {
    adminFetch.mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "CONFLICT", message: "Kode sudah dipakai.", fields: { code: ["Kode sudah dipakai."] } },
    });
    const result = await savePlatformPromo(null, validPromo);
    expect("error" in result && result.error.fields?.code).toEqual(["Kode sudah dipakai."]);
  });
  it("biaya: negatif, pecahan, NaN, string, > 100.000 ditolak; valid -> PUT", async () => {
    for (const value of [-1, 1.5, NaN, "5" as never, 100_001]) {
      const result = await saveServiceFee(value);
      expect("error" in result && result.error.fields?.value).toBeTruthy();
    }
    expect(adminFetch).not.toHaveBeenCalled();
    adminFetch.mockResolvedValue(okResponse({ service_fee: 2000 }));
    expect(await saveServiceFee(2000)).toEqual({ data: { service_fee: 2000 } });
    expect(adminFetch).toHaveBeenCalledWith("/settings/service-fee", {
      method: "PUT",
      body: JSON.stringify({ value: 2000 }),
    });
  });
});
