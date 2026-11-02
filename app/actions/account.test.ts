import { afterEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "kk_skenario" && jar.value ? { name: n, value: jar.value } : undefined) }),
}));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/lib/session", () => ({ requireMerchant: () => requireMerchant() }));
import { changePassword } from "./account";

afterEach(() => { vi.unstubAllEnvs(); jar.value = undefined; requireMerchant.mockClear(); });
const set = (v: string) => { vi.stubEnv("NODE_ENV", "development"); jar.value = v; };

describe("changePassword (PG-N2, PG-E2)", () => {
  it("sukses", async () => {
    expect(await changePassword({ current_password: "lama1234", new_password: "baru12345" })).toEqual({ data: { ok: true } });
    expect(requireMerchant).toHaveBeenCalled();
  });
  it("sandi baru lemah -> VALIDATION_ERROR new_password", async () => {
    const r = await changePassword({ current_password: "lama1234", new_password: "abc" });
    expect("error" in r && r.error.fields?.new_password).toBeTruthy();
  });
  it("konflik -> current_password salah", async () => {
    set("konflik");
    const r = await changePassword({ current_password: "lama1234", new_password: "baru12345" });
    expect("error" in r && r.error).toMatchObject({ code: "VALIDATION_ERROR", fields: { current_password: ["Kata sandi lama salah."] } });
  });
  it("gagal-aksi -> INTERNAL_ERROR", async () => {
    set("gagal-aksi");
    const r = await changePassword({ current_password: "lama1234", new_password: "baru12345" });
    expect("error" in r && r.error.code).toBe("INTERNAL_ERROR");
  });
});
