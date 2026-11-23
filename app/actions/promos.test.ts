// Test server action promo penjual (app/actions/promos.ts): simpan, aktif/nonaktif, dan hapus promo.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { afterEach, describe, expect, it, vi } from "vitest";

const cookieJar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "kk_skenario" && cookieJar.value ? { name: name, value: cookieJar.value } : undefined,
  }),
}));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  merchantFetch: (...args: unknown[]) => merchantFetch(...args),
}));
import { deletePromo, savePromo, setPromoActive } from "./promos";

const validPromo = {
  code: "BARU10",
  description: "Promo baru",
  type: "percent",
  value: 10,
  max_discount: 5000,
  min_subtotal: 0,
  quota: null,
  per_user_limit: 1,
  starts_at: "2026-11-01T00:00:00.000Z",
  ends_at: "2026-12-01T00:00:00.000Z",
  is_active: true,
};
const mockSuccess = (data: unknown) => merchantFetch.mockResolvedValue({ ok: true, status: 200, data });
const setScenario = (value: string) => {
  vi.stubEnv("NODE_ENV", "development");
  cookieJar.value = value;
};
afterEach(() => {
  cookieJar.value = undefined;
  vi.unstubAllEnvs();
  requireMerchant.mockClear();
  merchantFetch.mockReset();
});
const sentBody = () => JSON.parse(merchantFetch.mock.calls[0][1].body);

describe("savePromo (M-13, F12)", () => {
  it("baru -> POST /promos; kode huruf besar; kunci asing dibuang", async () => {
    mockSuccess({ id: 7, ...validPromo, used_count: 0 });
    const result = await savePromo(null, { ...validPromo, code: " baru10 ", used_count: 99, merchant_id: 3 });
    expect(requireMerchant).toHaveBeenCalled();
    expect(result).toMatchObject({ data: { id: 7 } });
    expect(merchantFetch).toHaveBeenCalledWith("/promos", expect.objectContaining({ method: "POST" }));
    expect(sentBody()).toMatchObject({ code: "BARU10", is_active: true });
    expect(sentBody()).not.toHaveProperty("used_count");
    expect(sentBody()).not.toHaveProperty("merchant_id");
  });
  it("ubah -> PATCH /promos/:id", async () => {
    mockSuccess({ id: 1, ...validPromo });
    await savePromo(1, validPromo);
    expect(merchantFetch).toHaveBeenCalledWith("/promos/1", expect.objectContaining({ method: "PATCH" }));
  });
  it("PR-E2 validasi klien: nilai, persen, tanggal, kode, kuota -> tanpa memanggil API", async () => {
    for (const [override, field] of [
      [{ value: 0 }, "value"],
      [{ value: 101 }, "value"],
      [{ ends_at: validPromo.starts_at }, "ends_at"],
      [{ code: "a!" }, "code"],
      [{ quota: 0 }, "quota"],
    ] as const) {
      const result = await savePromo(null, { ...validPromo, ...override });
      expect("error" in result && result.error.fields?.[field]).toBeTruthy();
    }
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("free_service_fee tanpa nilai; max_discount hanya untuk persen", async () => {
    mockSuccess({});
    await savePromo(null, { ...validPromo, type: "free_service_fee", value: 0, max_discount: 5000 });
    expect(sentBody()).toMatchObject({ value: 0, max_discount: null });
  });
  it("PR-E1 kode dipakai dari backend diteruskan ke field kode", async () => {
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "CONFLICT", message: "Kode sudah dipakai.", fields: { code: ["Kode sudah dipakai."] } },
    });
    const result = await savePromo(null, validPromo);
    expect("error" in result && result.error.fields?.code).toEqual(["Kode sudah dipakai."]);
  });
  it("skenario konflik & gagal-aksi; id tak valid", async () => {
    setScenario("konflik");
    expect(((await savePromo(null, validPromo)) as { error: { fields: unknown } }).error.fields).toEqual({
      code: ["Kode sudah dipakai."],
    });
    setScenario("gagal-aksi");
    expect("error" in (await savePromo(null, validPromo))).toBe(true);
    expect(((await savePromo(0, validPromo)) as { error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
  });
});

describe("setPromoActive & deletePromo", () => {
  it("is_active lewat PATCH; hapus lewat DELETE", async () => {
    mockSuccess({ id: 1, is_active: false });
    expect(await setPromoActive(1, false)).toMatchObject({ data: { is_active: false } });
    expect(merchantFetch).toHaveBeenCalledWith("/promos/1", {
      method: "PATCH",
      body: JSON.stringify({ is_active: false }),
    });
    mockSuccess({ id: 2 });
    expect(await deletePromo(2)).toEqual({ data: { id: 2 } });
    expect(merchantFetch).toHaveBeenLastCalledWith("/promos/2", { method: "DELETE" });
  });
  it("PR-N3 promo terpakai: CONFLICT dari backend", async () => {
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "CONFLICT", message: "Promo sudah dipakai. Nonaktifkan saja." },
    });
    expect(await deletePromo(1)).toMatchObject({ error: { code: "CONFLICT" } });
  });
  it("argumen tidak valid -> VALIDATION_ERROR tanpa API", async () => {
    for (const id of [0, -1, 1.5, "1", null, NaN]) {
      const activeResult = await setPromoActive(id as never, true);
      expect("error" in activeResult && activeResult.error.code).toBe("VALIDATION_ERROR");
      const deleteResult = await deletePromo(id as never);
      expect("error" in deleteResult && deleteResult.error.code).toBe("VALIDATION_ERROR");
    }
    const invalidFlagResult = await setPromoActive(1, "ya" as never);
    expect("error" in invalidFlagResult && invalidFlagResult.error.code).toBe("VALIDATION_ERROR");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("gagal-aksi", async () => {
    setScenario("gagal-aksi");
    expect("error" in (await deletePromo(2))).toBe(true);
    expect("error" in (await setPromoActive(1, false))).toBe(true);
  });
});
