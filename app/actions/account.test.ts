import { afterEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "kk_skenario" && jar.value ? { name: n, value: jar.value } : undefined) }),
}));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/authService", () => ({ requireMerchant: () => requireMerchant(), getSessionToken: async () => "tok" }));
const apiFetch = vi.fn();
vi.mock("@/services/api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));
import { changePassword } from "./account";

afterEach(() => { vi.unstubAllEnvs(); jar.value = undefined; requireMerchant.mockClear(); apiFetch.mockReset(); });
const set = (v: string) => { vi.stubEnv("NODE_ENV", "development"); jar.value = v; };
const isi = { current_password: "lama1234", new_password: "baru12345" };

describe("changePassword (PG-N2, PG-E2)", () => {
  it("sukses: PUT /me/password dengan token sesi (204)", async () => {
    apiFetch.mockResolvedValue({ ok: true, status: 204, data: undefined });
    expect(await changePassword(isi)).toEqual({ data: { ok: true } });
    expect(requireMerchant).toHaveBeenCalled();
    expect(apiFetch).toHaveBeenCalledWith("/me/password", expect.objectContaining({ method: "PUT", token: "tok", body: JSON.stringify(isi) }));
  });
  it("sandi lama salah dari backend -> fields diteruskan", async () => {
    const error = { code: "VALIDATION_ERROR", message: "Data tidak valid.", fields: { current_password: ["Kata sandi lama salah."] } };
    apiFetch.mockResolvedValue({ ok: false, status: 400, error });
    expect(await changePassword(isi)).toEqual({ error });
  });
  it("sandi baru lemah -> VALIDATION_ERROR new_password, tanpa memanggil API", async () => {
    const r = await changePassword({ current_password: "lama1234", new_password: "abc" });
    expect("error" in r && r.error.fields?.new_password).toBeTruthy();
    expect(apiFetch).not.toHaveBeenCalled();
  });
  it("konflik -> current_password salah", async () => {
    set("konflik");
    const r = await changePassword(isi);
    expect("error" in r && r.error).toMatchObject({ code: "VALIDATION_ERROR", fields: { current_password: ["Kata sandi lama salah."] } });
  });
  it("gagal-aksi -> INTERNAL_ERROR", async () => {
    set("gagal-aksi");
    const r = await changePassword(isi);
    expect("error" in r && r.error.code).toBe("INTERNAL_ERROR");
  });
});
