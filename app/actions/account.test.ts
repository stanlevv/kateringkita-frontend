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
import { changePassword } from "./account";

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

describe("changePassword (PG-N2, PG-E2)", () => {
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
