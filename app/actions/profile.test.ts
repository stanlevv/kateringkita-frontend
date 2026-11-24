// Test server action saveProfile (app/actions/profile.ts): hanya field yang boleh diubah yang dikirim ke backend.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
import { saveProfile } from "./profile";

const validProfile = {
  business_name: "Dapur Baru",
  logo_url: null,
  description: "",
  address: "Jl. A",
  wa_number: "081234567890",
  service_mode: "daily",
  open_time: "07:00",
  close_time: "16:00",
  hold_minutes: 5,
  daily_revenue_target: 0,
  pickup_point_ids: [1],
};
const sentBody = () => JSON.parse(merchantFetch.mock.calls[0][1].body);
beforeEach(() => {
  merchantFetch.mockReset();
  merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { business_name: "Dari Server" } });
});
afterEach(() => {
  vi.unstubAllEnvs();
  cookieJar.value = undefined;
  requireMerchant.mockClear();
});

describe("saveProfile", () => {
  it("meneruskan logo_url ke backend; qris_image_url tidak dikirim lagi", async () => {
    await saveProfile({
      ...validProfile,
      logo_url: "https://cdn.test/l.png",
      qris_image_url: "https://cdn.test/q.png",
    });
    expect(sentBody()).toMatchObject({ logo_url: "https://cdn.test/l.png" });
    expect("qris_image_url" in sentBody()).toBe(false);
  });
  it("galat backend fields.logo_url diteruskan", async () => {
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 400,
      error: { code: "VALIDATION_ERROR", message: "x", fields: { logo_url: ["Foto tidak valid. Unggah ulang foto."] } },
    });
    expect(await saveProfile(validProfile)).toMatchObject({
      error: { fields: { logo_url: ["Foto tidak valid. Unggah ulang foto."] } },
    });
  });
  it("memanggil requireMerchant lebih dulu", async () => {
    await saveProfile(validProfile);
    expect(requireMerchant).toHaveBeenCalled();
  });
  it("valid -> PATCH /profile satu kali; hasil = data server", async () => {
    const result = await saveProfile(validProfile);
    expect(merchantFetch).toHaveBeenCalledTimes(1);
    expect(merchantFetch.mock.calls[0][0]).toBe("/profile");
    expect(merchantFetch.mock.calls[0][1].method).toBe("PATCH");
    expect(result).toEqual({ data: { business_name: "Dari Server" } });
  });
  it("hanya field yang boleh diubah; kunci lain diabaikan; teks dirapikan", async () => {
    await saveProfile({
      ...validProfile,
      description: "  halo  ",
      is_open: false,
      merchant_type: { id: 9, name: "x" },
      extra: "x",
    });
    const body = sentBody();
    expect(body).toMatchObject({ description: "halo", business_name: "Dapur Baru" });
    for (const key of ["is_open", "merchant_type", "extra"]) expect(key in body).toBe(false);
  });
  it("tidak valid -> VALIDATION_ERROR lokal, server tidak dipanggil", async () => {
    const result = await saveProfile({ ...validProfile, close_time: "06:00", pickup_point_ids: [] });
    expect("error" in result && result.error.code).toBe("VALIDATION_ERROR");
    expect("error" in result && result.error.fields?.close_time).toBeTruthy();
    expect("error" in result && result.error.fields?.pickup_point_ids).toBeTruthy();
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("hanya wa_template -> body { wa_template }; tak dikenal ditolak lokal", async () => {
    await saveProfile({ wa_template: "Halo {nama}" });
    expect(sentBody()).toEqual({ wa_template: "Halo {nama}" });
    merchantFetch.mockClear();
    const result = await saveProfile({ wa_template: "{harga}" });
    expect("error" in result && result.error.fields?.wa_template).toBeTruthy();
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("galat field dari server diteruskan apa adanya", async () => {
    const error = {
      code: "VALIDATION_ERROR",
      message: "Periksa isian.",
      fields: { pickup_point_ids: ["Titik temu tidak tersedia."] },
    };
    merchantFetch.mockResolvedValue({ ok: false, status: 400, error });
    expect(await saveProfile(validProfile)).toEqual({ error });
  });
  it("input bukan objek -> VALIDATION_ERROR", async () => {
    const result = await saveProfile(null);
    expect("error" in result && result.error.code).toBe("VALIDATION_ERROR");
  });
  it("gagal-aksi -> INTERNAL_ERROR tanpa memanggil server", async () => {
    vi.stubEnv("NODE_ENV", "development");
    cookieJar.value = "gagal-aksi";
    const result = await saveProfile(validProfile);
    expect("error" in result && result.error.code).toBe("INTERNAL_ERROR");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});
