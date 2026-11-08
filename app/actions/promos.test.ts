import { afterEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "kk_skenario" && jar.value ? { name: n, value: jar.value } : undefined) }),
}));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/authService", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), merchantFetch: (...a: unknown[]) => merchantFetch(...a) }));
import { deletePromo, savePromo, setPromoActive } from "./promos";

const ok = { code: "BARU10", description: "Promo baru", type: "percent", value: 10, max_discount: 5000, min_subtotal: 0, quota: null, per_user_limit: 1, starts_at: "2026-11-01T00:00:00.000Z", ends_at: "2026-12-01T00:00:00.000Z", is_active: true };
const sukses = (data: unknown) => merchantFetch.mockResolvedValue({ ok: true, status: 200, data });
const set = (v: string) => { vi.stubEnv("NODE_ENV", "development"); jar.value = v; };
afterEach(() => { jar.value = undefined; vi.unstubAllEnvs(); requireMerchant.mockClear(); merchantFetch.mockReset(); });
const body = () => JSON.parse(merchantFetch.mock.calls[0][1].body);

describe("savePromo (M-13, F12)", () => {
  it("baru -> POST /promos; kode huruf besar; kunci asing dibuang", async () => {
    sukses({ id: 7, ...ok, used_count: 0 });
    const r = await savePromo(null, { ...ok, code: " baru10 ", used_count: 99, merchant_id: 3 });
    expect(requireMerchant).toHaveBeenCalled();
    expect(r).toMatchObject({ data: { id: 7 } });
    expect(merchantFetch).toHaveBeenCalledWith("/promos", expect.objectContaining({ method: "POST" }));
    expect(body()).toMatchObject({ code: "BARU10", is_active: true });
    expect(body()).not.toHaveProperty("used_count");
    expect(body()).not.toHaveProperty("merchant_id");
  });
  it("ubah -> PATCH /promos/:id", async () => {
    sukses({ id: 1, ...ok });
    await savePromo(1, ok);
    expect(merchantFetch).toHaveBeenCalledWith("/promos/1", expect.objectContaining({ method: "PATCH" }));
  });
  it("PR-E2 validasi klien: nilai, persen, tanggal, kode, kuota -> tanpa memanggil API", async () => {
    for (const [isi, field] of [[{ value: 0 }, "value"], [{ value: 101 }, "value"], [{ ends_at: ok.starts_at }, "ends_at"], [{ code: "a!" }, "code"], [{ quota: 0 }, "quota"]] as const) {
      const r = await savePromo(null, { ...ok, ...isi });
      expect("error" in r && r.error.fields?.[field]).toBeTruthy();
    }
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("free_service_fee tanpa nilai; max_discount hanya untuk persen", async () => {
    sukses({});
    await savePromo(null, { ...ok, type: "free_service_fee", value: 0, max_discount: 5000 });
    expect(body()).toMatchObject({ value: 0, max_discount: null });
  });
  it("PR-E1 kode dipakai dari backend diteruskan ke field kode", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 409, error: { code: "CONFLICT", message: "Kode sudah dipakai.", fields: { code: ["Kode sudah dipakai."] } } });
    const r = await savePromo(null, ok);
    expect("error" in r && r.error.fields?.code).toEqual(["Kode sudah dipakai."]);
  });
  it("skenario konflik & gagal-aksi; id tak valid", async () => {
    set("konflik");
    expect((await savePromo(null, ok) as { error: { fields: unknown } }).error.fields).toEqual({ code: ["Kode sudah dipakai."] });
    set("gagal-aksi");
    expect("error" in (await savePromo(null, ok)) ).toBe(true);
    expect((await savePromo(0, ok) as { error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
  });
});

describe("setPromoActive & deletePromo", () => {
  it("is_active lewat PATCH; hapus lewat DELETE", async () => {
    sukses({ id: 1, is_active: false });
    expect(await setPromoActive(1, false)).toMatchObject({ data: { is_active: false } });
    expect(merchantFetch).toHaveBeenCalledWith("/promos/1", { method: "PATCH", body: JSON.stringify({ is_active: false }) });
    sukses({ id: 2 });
    expect(await deletePromo(2)).toEqual({ data: { id: 2 } });
    expect(merchantFetch).toHaveBeenLastCalledWith("/promos/2", { method: "DELETE" });
  });
  it("PR-N3 promo terpakai: CONFLICT dari backend", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 409, error: { code: "CONFLICT", message: "Promo sudah dipakai. Nonaktifkan saja." } });
    expect(await deletePromo(1)).toMatchObject({ error: { code: "CONFLICT" } });
  });
  it("argumen tidak valid -> VALIDATION_ERROR tanpa API", async () => {
    for (const id of [0, -1, 1.5, "1", null, NaN]) {
      const a = await setPromoActive(id as never, true);
      expect("error" in a && a.error.code).toBe("VALIDATION_ERROR");
      const b = await deletePromo(id as never);
      expect("error" in b && b.error.code).toBe("VALIDATION_ERROR");
    }
    const c = await setPromoActive(1, "ya" as never);
    expect("error" in c && c.error.code).toBe("VALIDATION_ERROR");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("gagal-aksi", async () => {
    set("gagal-aksi");
    expect("error" in (await deletePromo(2))).toBe(true);
    expect("error" in (await setPromoActive(1, false))).toBe(true);
  });
});
