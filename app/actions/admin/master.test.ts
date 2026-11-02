import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/lib/session", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/lib/admin/api", async (asli) => ({ ...(await asli<object>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
import { setAktifMaster, simpanMaster, tukarUrutan } from "./master";
import { setAktifPromoPlatform, simpanBiayaLayanan, simpanPromoPlatform } from "./promos";

const ok = (data: unknown = {}) => ({ ok: true, status: 200, data });
const promoValid = { code: "ramadan", description: "", type: "percent", value: 10, max_discount: null, min_subtotal: 0, quota: null, per_user_limit: 1, starts_at: "2026-11-01T00:00:00.000Z", ends_at: "2026-12-01T00:00:00.000Z", is_active: true };

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset().mockResolvedValue(ok());
});

describe("requireAdmin di semua action admin (A-01…A-04)", () => {
  it("menolak -> backend tidak dipanggil", async () => {
    requireAdmin.mockRejectedValue(new Error("404"));
    const semua = [
      () => simpanMaster("categories", null, { name: "a" }), () => setAktifMaster("categories", 1, true),
      () => tukarUrutan("categories", { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }),
      () => simpanPromoPlatform(null, promoValid), () => setAktifPromoPlatform(1, true), () => simpanBiayaLayanan(1000),
    ];
    for (const f of semua) await expect(f()).rejects.toThrow();
    expect(adminFetch).not.toHaveBeenCalled();
  });
});

describe("master", () => {
  it("kind di luar whitelist, id tak valid, nama kosong/terlalu panjang ditolak tanpa panggilan", async () => {
    for (const r of [
      await simpanMaster("users", null, { name: "a" }), await simpanMaster("toString", null, { name: "a" }),
      await simpanMaster("categories", 0, { name: "a" }), await setAktifMaster("categories", 1.5, true),
      await simpanMaster("categories", null, { name: "  " }), await simpanMaster("categories", null, { name: "x".repeat(61) }),
      await simpanMaster("categories", null, { name: "a", icon: "x".repeat(41) }),
      await simpanMaster("pickup-points", null, { name: "a", description: "x".repeat(256) }),
      await simpanMaster("merchant-types", null, { name: "x".repeat(101) }),
    ]) expect("error" in r && r.error.code).toBe("VALIDATION_ERROR");
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("whitelist kind: setAktifMaster, tukarUrutan, simpanMaster tanpa panggilan dan tanpa isi field", async () => {
    const a = { id: 1, sort_order: 1 }, b = { id: 2, sort_order: 2 };
    const r1 = await setAktifMaster("users", 1, true);
    const r2 = await tukarUrutan("users", a, b);
    const r3 = await simpanMaster("users", null, { name: "a" }); // cekMaster sendiri memberi fields; penjaga kind tidak
    for (const r of [r1, r2, r3]) expect("error" in r && r.error.code).toBe("VALIDATION_ERROR");
    expect("error" in r3 && r3.error.fields).toBeUndefined();
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("tukarUrutan: sort_order negatif/pecahan/sama dan id tak valid ditolak", async () => {
    for (const [a, b] of [
      [{ id: 1, sort_order: -1 }, { id: 2, sort_order: 2 }], [{ id: 1, sort_order: 1 }, { id: 2, sort_order: -2 }],
      [{ id: 1, sort_order: 1.5 }, { id: 2, sort_order: 2 }], [{ id: 1, sort_order: 3 }, { id: 2, sort_order: 3 }],
      [{ id: 0, sort_order: 1 }, { id: 2, sort_order: 2 }], [{ id: 1, sort_order: 1 }, { id: -2, sort_order: 2 }],
    ]) expect("error" in (await tukarUrutan("categories", a, b))).toBe(true);
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("buat dan ubah mengirim field milik jenisnya saja", async () => {
    await simpanMaster("pickup-points", null, { name: " Kantin ", description: " ", icon: "x" });
    expect(adminFetch).toHaveBeenLastCalledWith("/master/pickup-points", { method: "POST", body: JSON.stringify({ name: "Kantin", description: null }) });
    await simpanMaster("merchant-types", 4, { name: "Warung" });
    expect(adminFetch).toHaveBeenLastCalledWith("/master/merchant-types/4", { method: "PATCH", body: JSON.stringify({ name: "Warung" }) });
  });
  it("409 diteruskan apa adanya", async () => {
    const message = "Titik temu ini satu-satunya untuk toko: Dapur Ibu.";
    adminFetch.mockResolvedValue({ ok: false, status: 409, error: { code: "CONFLICT", message } });
    const r = await setAktifMaster("pickup-points", 2, false);
    expect("error" in r && r.error.message).toBe(message);
    expect(adminFetch).toHaveBeenCalledWith("/master/pickup-points/2/deactivate", { method: "POST" });
  });
  it("tukar urutan: dua PATCH dengan nilai bertukar", async () => {
    const r = await tukarUrutan("categories", { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 });
    expect(r).toEqual({ data: null });
    expect(adminFetch).toHaveBeenCalledTimes(2);
    expect(adminFetch).toHaveBeenNthCalledWith(1, "/master/categories/1", { method: "PATCH", body: JSON.stringify({ sort_order: 2 }) });
    expect(adminFetch).toHaveBeenNthCalledWith(2, "/master/categories/2", { method: "PATCH", body: JSON.stringify({ sort_order: 1 }) });
  });
  it("tukar urutan: PATCH kedua gagal -> yang pertama dikembalikan + galat", async () => {
    adminFetch.mockResolvedValueOnce(ok()).mockResolvedValueOnce({ ok: false, status: 500, error: { code: "X", message: "gagal" } }).mockResolvedValueOnce(ok());
    const r = await tukarUrutan("merchant-types", { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 });
    expect("error" in r).toBe(true);
    expect(adminFetch).toHaveBeenCalledTimes(3);
    expect(adminFetch).toHaveBeenNthCalledWith(3, "/master/merchant-types/1", { method: "PATCH", body: JSON.stringify({ sort_order: 1 }) });
  });
  it("tukar urutan ditolak untuk titik temu dan id sama", async () => {
    expect("error" in (await tukarUrutan("pickup-points", { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }))).toBe(true);
    expect("error" in (await tukarUrutan("categories", { id: 1, sort_order: 1 }, { id: 1, sort_order: 1 }))).toBe(true);
    expect(adminFetch).not.toHaveBeenCalled();
  });
});

describe("promo platform & biaya", () => {
  it("validasi sama dengan penjual; buat mengirim kode, ubah tanpa kode", async () => {
    const salah = await simpanPromoPlatform(null, { ...promoValid, value: 0 });
    expect("error" in salah && salah.error.fields?.value).toBeTruthy();
    expect(adminFetch).not.toHaveBeenCalled();
    adminFetch.mockResolvedValue(ok({ id: 5, is_active: true }));
    await simpanPromoPlatform(null, promoValid);
    const b1 = JSON.parse(adminFetch.mock.calls[0][1].body);
    expect(b1.code).toBe("RAMADAN");
    expect(b1.starts_at).toBe("2026-11-01T00:00:00.000Z");
    await simpanPromoPlatform(5, promoValid);
    expect(adminFetch.mock.calls[1][0]).toBe("/promos/5");
    expect(JSON.parse(adminFetch.mock.calls[1][1].body).code).toBeUndefined();
  });
  it("buat promo = tepat satu panggilan backend, tanpa is_active", async () => {
    adminFetch.mockResolvedValue(ok({ id: 5, is_active: true }));
    await simpanPromoPlatform(null, { ...promoValid, is_active: false });
    expect(adminFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(adminFetch.mock.calls[0][1].body).is_active).toBeUndefined();
  });
  it("409 kode ganda diteruskan dengan fields", async () => {
    adminFetch.mockResolvedValue({ ok: false, status: 409, error: { code: "CONFLICT", message: "Kode sudah dipakai.", fields: { code: ["Kode sudah dipakai."] } } });
    const r = await simpanPromoPlatform(null, promoValid);
    expect("error" in r && r.error.fields?.code).toEqual(["Kode sudah dipakai."]);
  });
  it("biaya: negatif, pecahan, NaN, string, > 100.000 ditolak; valid -> PUT", async () => {
    for (const v of [-1, 1.5, NaN, "5" as never, 100_001]) {
      const r = await simpanBiayaLayanan(v);
      expect("error" in r && r.error.fields?.value).toBeTruthy();
    }
    expect(adminFetch).not.toHaveBeenCalled();
    adminFetch.mockResolvedValue(ok({ service_fee: 2000 }));
    expect(await simpanBiayaLayanan(2000)).toEqual({ data: { service_fee: 2000 } });
    expect(adminFetch).toHaveBeenCalledWith("/settings/service-fee", { method: "PUT", body: JSON.stringify({ value: 2000 }) });
  });
});
