import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "kk_skenario" && jar.value ? { name: n, value: jar.value } : undefined) }),
}));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/lib/session", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/lib/merchant-api", () => ({ merchantFetch: (...a: unknown[]) => merchantFetch(...a) }));
import { saveProfile } from "./profile";

const ok = { business_name: "Dapur Baru", logo_url: null, qris_image_url: null, description: "", address: "Jl. A", wa_number: "081234567890", service_mode: "daily", open_time: "07:00", close_time: "16:00", hold_minutes: 5, daily_revenue_target: 0, pickup_point_ids: [1] };
const kirim = () => JSON.parse(merchantFetch.mock.calls[0][1].body);
beforeEach(() => {
  merchantFetch.mockReset();
  merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { business_name: "Dari Server" } });
});
afterEach(() => { vi.unstubAllEnvs(); jar.value = undefined; requireMerchant.mockClear(); });

describe("saveProfile (M-10, M-11)", () => {
  it("meneruskan logo_url / qris_image_url ke backend (F04 D15)", async () => {
    await saveProfile({ ...ok, logo_url: "https://cdn.test/l.png", qris_image_url: null });
    expect(kirim()).toMatchObject({ logo_url: "https://cdn.test/l.png", qris_image_url: null });
  });
  it("galat backend fields.logo_url diteruskan", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 400, error: { code: "VALIDATION_ERROR", message: "x", fields: { logo_url: ["Foto tidak valid. Unggah ulang foto."] } } });
    expect(await saveProfile(ok)).toMatchObject({ error: { fields: { logo_url: ["Foto tidak valid. Unggah ulang foto."] } } });
  });
  it("memanggil requireMerchant lebih dulu", async () => {
    await saveProfile(ok);
    expect(requireMerchant).toHaveBeenCalled();
  });
  it("valid -> PATCH /profile satu kali; hasil = data server", async () => {
    const r = await saveProfile(ok);
    expect(merchantFetch).toHaveBeenCalledTimes(1);
    expect(merchantFetch.mock.calls[0][0]).toBe("/profile");
    expect(merchantFetch.mock.calls[0][1].method).toBe("PATCH");
    expect(r).toEqual({ data: { business_name: "Dari Server" } });
  });
  it("hanya field yang boleh diubah; kunci lain diabaikan; teks dirapikan", async () => {
    await saveProfile({ ...ok, description: "  halo  ", is_open: false, merchant_type: { id: 9, name: "x" }, extra: "x" });
    const body = kirim();
    expect(body).toMatchObject({ description: "halo", business_name: "Dapur Baru" });
    for (const k of ["is_open", "merchant_type", "extra"]) expect(k in body).toBe(false);
  });
  it("PG-E1 tidak valid -> VALIDATION_ERROR lokal, server tidak dipanggil", async () => {
    const r = await saveProfile({ ...ok, close_time: "06:00", pickup_point_ids: [] });
    expect("error" in r && r.error.code).toBe("VALIDATION_ERROR");
    expect("error" in r && r.error.fields?.close_time).toBeTruthy();
    expect("error" in r && r.error.fields?.pickup_point_ids).toBeTruthy();
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("hanya wa_template (M-11) -> body { wa_template }; tak dikenal ditolak lokal", async () => {
    await saveProfile({ wa_template: "Halo {nama}" });
    expect(kirim()).toEqual({ wa_template: "Halo {nama}" });
    merchantFetch.mockClear();
    const b = await saveProfile({ wa_template: "{harga}" });
    expect("error" in b && b.error.fields?.wa_template).toBeTruthy();
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("galat field dari server diteruskan apa adanya", async () => {
    const error = { code: "VALIDATION_ERROR", message: "Periksa isian.", fields: { pickup_point_ids: ["Titik temu tidak tersedia."] } };
    merchantFetch.mockResolvedValue({ ok: false, status: 400, error });
    expect(await saveProfile(ok)).toEqual({ error });
  });
  it("input bukan objek -> VALIDATION_ERROR", async () => {
    const r = await saveProfile(null);
    expect("error" in r && r.error.code).toBe("VALIDATION_ERROR");
  });
  it("gagal-aksi -> INTERNAL_ERROR tanpa memanggil server", async () => {
    vi.stubEnv("NODE_ENV", "development");
    jar.value = "gagal-aksi";
    const r = await saveProfile(ok);
    expect("error" in r && r.error.code).toBe("INTERNAL_ERROR");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});
