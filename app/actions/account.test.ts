// Test server action changePassword (app/actions/account.ts): validasi isian, skenario pratinjau, dan galat backend.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { afterEach, describe, expect, it, vi } from "vitest";

const cookieJar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "kk_skenario" && cookieJar.value ? { name: name, value: cookieJar.value } : undefined,
  }),
}));
const getSession = vi.fn(async () => ({ user: { role: "merchant" }, merchant: null }));
vi.mock("@/services/auth.service", () => ({ getSession: () => getSession(), getSessionToken: async () => "tok" }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
const apiFetch = vi.fn();
vi.mock("@/services/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));
import { changePassword, sendEmailCode, updateAccount, verifyEmailCode } from "./account";

afterEach(() => {
  vi.unstubAllEnvs();
  cookieJar.value = undefined;
  getSession.mockClear();
  apiFetch.mockReset();
});
const setScenario = (value: string) => {
  vi.stubEnv("NODE_ENV", "development");
  cookieJar.value = value;
};
const passwordInput = { current_password: "lama1234", new_password: "baru12345" };

describe("changePassword", () => {
  it("sukses: PUT /me/password dengan token sesi (204)", async () => {
    apiFetch.mockResolvedValue({ ok: true, status: 204, data: undefined });
    expect(await changePassword(passwordInput)).toEqual({ data: { ok: true } });
    expect(getSession).toHaveBeenCalled();
    expect(apiFetch).toHaveBeenCalledWith(
      "/me/password",
      expect.objectContaining({ method: "PUT", token: "tok", body: JSON.stringify(passwordInput) }),
    );
  });
  it("sandi lama salah dari backend -> fields diteruskan", async () => {
    const error = {
      code: "VALIDATION_ERROR",
      message: "Data tidak valid.",
      fields: { current_password: ["Kata sandi lama salah."] },
    };
    apiFetch.mockResolvedValue({ ok: false, status: 400, error });
    expect(await changePassword(passwordInput)).toEqual({ error });
  });
  it("sandi baru lemah -> VALIDATION_ERROR new_password, tanpa memanggil API", async () => {
    const result = await changePassword({ current_password: "lama1234", new_password: "abc" });
    expect("error" in result && result.error.fields?.new_password).toBeTruthy();
    expect(apiFetch).not.toHaveBeenCalled();
  });
  it("konflik -> current_password salah", async () => {
    setScenario("konflik");
    const result = await changePassword(passwordInput);
    expect("error" in result && result.error).toMatchObject({
      code: "VALIDATION_ERROR",
      fields: { current_password: ["Kata sandi lama salah."] },
    });
  });
  it("gagal-aksi -> INTERNAL_ERROR", async () => {
    setScenario("gagal-aksi");
    const result = await changePassword(passwordInput);
    expect("error" in result && result.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("akun dan email", () => {
  it("updateAccount: PATCH /me tanpa sandi bila kosong; isian salah ditolak tanpa backend", async () => {
    apiFetch.mockResolvedValue({ ok: true, status: 200, data: { user: { full_name: "Diego" }, merchant: null } });
    expect(await updateAccount({ full_name: " Diego ", phone: "081234567890", current_password: "" })).toEqual({
      data: { user: { full_name: "Diego" }, merchant: null },
    });
    expect(apiFetch).toHaveBeenCalledWith(
      "/me",
      expect.objectContaining({
        method: "PATCH",
        token: "tok",
        body: JSON.stringify({ full_name: "Diego", phone: "081234567890" }),
      }),
    );
    apiFetch.mockReset();
    expect(await updateAccount({ full_name: "", phone: "12", current_password: "" })).toMatchObject({
      error: { fields: { full_name: expect.any(Array), phone: expect.any(Array) } },
    });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("sendEmailCode: null = verifikasi email akun; ganti email dikirim huruf kecil bersama sandi", async () => {
    apiFetch.mockResolvedValue({ ok: true, status: 200, data: { email: "d@x.id" } });
    expect(await sendEmailCode(null)).toEqual({ data: { email: "d@x.id" } });
    expect(apiFetch).toHaveBeenLastCalledWith("/me/email/otp", expect.objectContaining({ method: "POST", body: "{}" }));
    await sendEmailCode({ email: " Baru@X.id ", current_password: "rahasia123" });
    expect(apiFetch).toHaveBeenLastCalledWith(
      "/me/email/otp",
      expect.objectContaining({ body: JSON.stringify({ email: "baru@x.id", current_password: "rahasia123" }) }),
    );
    apiFetch.mockReset();
    expect(await sendEmailCode({ email: "bukan-email", current_password: "" })).toMatchObject({
      error: { fields: { email: expect.any(Array), current_password: expect.any(Array) } },
    });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("verifyEmailCode: kode 6 angka ke /me/email/verify; selain itu ditolak tanpa backend", async () => {
    apiFetch.mockResolvedValue({ ok: true, status: 200, data: { user: { email_verified: true }, merchant: null } });
    expect(await verifyEmailCode(" 123456 ")).toEqual({ data: { user: { email_verified: true }, merchant: null } });
    expect(apiFetch).toHaveBeenCalledWith(
      "/me/email/verify",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ code: "123456" }) }),
    );
    apiFetch.mockReset();
    expect(await verifyEmailCode("12ab")).toMatchObject({ error: { fields: { code: ["Kode berisi 6 angka."] } } });
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
