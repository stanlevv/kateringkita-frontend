import { afterEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "kk_skenario" && jar.value ? { name: n, value: jar.value } : undefined) }),
}));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/authService", () => ({ requireMerchant: () => requireMerchant() }));
import { deletePromo, savePromo, setPromoActive } from "./promos";

const ok = { code: "BARU10", description: "Promo baru", type: "percent", value: 10, max_discount: 5000, min_subtotal: 0, quota: null, per_user_limit: 1, starts_at: "2026-11-01T00:00:00.000Z", ends_at: "2026-12-01T00:00:00.000Z", is_active: true };
afterEach(() => { jar.value = undefined; requireMerchant.mockClear(); });

describe("savePromo (M-13)", () => {
  it("requireMerchant lebih dulu; kode dipaksa huruf besar; promo baru terpakai 0", async () => {
    const r = await savePromo(null, { ...ok, code: " baru10 " });
    expect(requireMerchant).toHaveBeenCalled();
    expect("data" in r && r.data).toMatchObject({ code: "BARU10", used_count: 0, type: "percent", quota: null });
    expect("data" in r && r.data.id).toBeGreaterThan(0);
  });
  it("PR-E2 nilai <= 0, persen > 100, selesai <= mulai, kode salah", async () => {
    const a = await savePromo(null, { ...ok, value: 0 });
    expect("error" in a && a.error.code).toBe("VALIDATION_ERROR");
    expect("error" in a && a.error.fields?.value).toBeTruthy();
    const b = await savePromo(null, { ...ok, value: 101 });
    expect("error" in b && b.error.fields?.value).toBeTruthy();
    const c = await savePromo(null, { ...ok, ends_at: ok.starts_at });
    expect("error" in c && c.error.fields?.ends_at).toBeTruthy();
    const d = await savePromo(null, { ...ok, code: "a!" });
    expect("error" in d && d.error.fields?.code).toEqual(["Kode 3–30 huruf besar atau angka."]);
  });
  it("free_service_fee tidak butuh nilai; max_discount hanya untuk persen", async () => {
    const r = await savePromo(null, { ...ok, type: "free_service_fee", value: 0, max_discount: 5000 });
    expect("data" in r && r.data).toMatchObject({ value: 0, max_discount: null });
    const f = await savePromo(null, { ...ok, type: "fixed", value: 3000, max_discount: 5000 });
    expect("data" in f && f.data.max_discount).toBe(null);
  });
  it("kuota kosong = tanpa batas, atau >= 1", async () => {
    const r = await savePromo(null, { ...ok, quota: 0 });
    expect("error" in r && r.error.fields?.quota).toBeTruthy();
  });
  it("PR-E1 kode sudah dipakai promo lain -> field kode; mengubah diri sendiri boleh", async () => {
    const dup = await savePromo(null, { ...ok, code: "hemat10" });
    expect("error" in dup && dup.error.fields?.code).toEqual(["Kode sudah dipakai."]);
    const sendiri = await savePromo(1, { ...ok, code: "HEMAT10", quota: 100 });
    expect("data" in sendiri && sendiri.data).toMatchObject({ id: 1, used_count: 37 });
  });
  it("PR-E1 skenario konflik", async () => {
    jar.value = "konflik";
    const r = await savePromo(null, ok);
    expect("error" in r && r.error.fields?.code).toEqual(["Kode sudah dipakai."]);
  });
  it("kuota tak boleh di bawah yang sudah terpakai", async () => {
    const r = await savePromo(1, { ...ok, code: "HEMAT10", quota: 10 });
    expect("error" in r && r.error.fields?.quota).toBeTruthy();
  });
  it("gagal-aksi -> error", async () => {
    jar.value = "gagal-aksi";
    const r = await savePromo(null, ok);
    expect("error" in r && r.error.code).toBe("INTERNAL_ERROR");
  });
  it("id tak dikenal -> NOT_FOUND; kunci asing diabaikan", async () => {
    const r = await savePromo(999, ok);
    expect("error" in r && r.error.code).toBe("NOT_FOUND");
    const s = await savePromo(null, { ...ok, used_count: 99, merchant_id: 3 });
    expect("data" in s && s.data.used_count).toBe(0);
    expect("data" in s && "merchant_id" in s.data).toBe(false);
  });
});

describe("setPromoActive & deletePromo", () => {
  it("mengubah is_active", async () => {
    const r = await setPromoActive(1, false);
    expect("data" in r && r.data).toMatchObject({ id: 1, is_active: false });
  });
  it("PR-N3 hapus hanya bila belum dipakai", async () => {
    const dipakai = await deletePromo(1);
    expect("error" in dipakai && dipakai.error.code).toBe("CONFLICT");
    const belum = await deletePromo(2);
    expect("data" in belum && belum.data).toEqual({ id: 2 });
  });
  it("argumen tidak valid -> VALIDATION_ERROR", async () => {
    for (const id of [0, -1, 1.5, "1", null, NaN]) {
      const a = await setPromoActive(id as never, true);
      expect("error" in a && a.error.code).toBe("VALIDATION_ERROR");
      const b = await deletePromo(id as never);
      expect("error" in b && b.error.code).toBe("VALIDATION_ERROR");
    }
    const c = await setPromoActive(1, "ya" as never);
    expect("error" in c && c.error.code).toBe("VALIDATION_ERROR");
  });
  it("gagal-aksi", async () => {
    jar.value = "gagal-aksi";
    const r = await deletePromo(2);
    expect("error" in r).toBe(true);
    const s = await setPromoActive(1, false);
    expect("error" in s).toBe(true);
  });
});
