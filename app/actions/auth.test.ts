import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((to: string) => { throw new Error(`REDIRECT ${to}`); });
const set = vi.fn();
const apiFetch = vi.fn();
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));
const hdrs = new Map<string, string>();
vi.mock("next/headers", () => ({ cookies: async () => ({ set }), headers: async () => ({ get: (k: string) => hdrs.get(k) ?? null }) }));
vi.mock("@/services/api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));
vi.mock("@/services/authService", () => ({ SESSION_COOKIE: "kk_session", getSessionToken: async () => undefined }));

import { login, mintaKodeReset, resetKataSandi } from "./auth";

const masuk = (role: string) =>
  apiFetch.mockResolvedValue({ ok: true, status: 200, data: { token: "tok", expires_at: "2030-01-01T00:00:00Z", user: { role } } });
const form = (next?: string) => {
  const f = new FormData();
  f.set("identifier", "a@b.id"); f.set("password", "x");
  if (next !== undefined) f.set("next", next);
  return f;
};

beforeEach(() => { hdrs.clear(); vi.unstubAllEnvs(); apiFetch.mockReset(); redirect.mockClear(); set.mockClear(); });

describe("F18 login web per role", () => {
  it("admin -> /admin", async () => {
    masuk("admin");
    await expect(login({}, form())).rejects.toThrow("REDIRECT /admin");
    expect(set).toHaveBeenCalled();
  });
  it("admin dengan next=/dashboard -> /admin", async () => {
    masuk("admin");
    await expect(login({}, form("/dashboard"))).rejects.toThrow("REDIRECT /admin");
  });
  it("admin dengan next=/admin/verifikasi -> /admin/verifikasi", async () => {
    masuk("admin");
    await expect(login({}, form("/admin/verifikasi"))).rejects.toThrow("REDIRECT /admin/verifikasi");
  });
  it("admin dengan next=/adminx atau //evil -> /admin", async () => {
    masuk("admin");
    await expect(login({}, form("/adminx"))).rejects.toThrow("REDIRECT /admin");
    await expect(login({}, form("//evil.com"))).rejects.toThrow("REDIRECT /admin");
  });
  it("penjual -> /dashboard", async () => {
    masuk("merchant");
    await expect(login({}, form())).rejects.toThrow("REDIRECT /dashboard");
  });
  it("penjual dengan next=/admin... -> /dashboard; next lain tetap dipakai", async () => {
    masuk("merchant");
    await expect(login({}, form("/admin"))).rejects.toThrow(/^REDIRECT \/dashboard$/);
    await expect(login({}, form("/admin/verifikasi"))).rejects.toThrow(/^REDIRECT \/dashboard$/);
    await expect(login({}, form("/menu"))).rejects.toThrow(/^REDIRECT \/menu$/);
  });
  it("pembeli ditolak, token dicabut, tanpa cookie", async () => {
    masuk("customer");
    const r = await login({}, form());
    expect(r.code).toBe("NOT_MERCHANT");
    expect(set).not.toHaveBeenCalled();
    expect(apiFetch).toHaveBeenCalledWith("/auth/logout", expect.objectContaining({ token: "tok" }));
  });
});

describe("F01-SEC-2 IP klien ke backend", () => {
  const header = () => (apiFetch.mock.calls[0][1] as { headers?: Record<string, string> }).headers;
  it("mengirim X-Client-IP & X-Internal-Secret bila rahasia diisi (x-real-ip diutamakan)", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "s".repeat(32));
    hdrs.set("x-real-ip", "203.0.113.5"); hdrs.set("x-forwarded-for", "198.51.100.1, 10.0.0.1");
    masuk("admin");
    await expect(login({}, form())).rejects.toThrow("REDIRECT /admin");
    expect(header()).toEqual({ "X-Client-IP": "203.0.113.5", "X-Internal-Secret": "s".repeat(32) });
  });
  it("memakai entri pertama x-forwarded-for bila tanpa x-real-ip", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "s".repeat(32));
    hdrs.set("x-forwarded-for", " 198.51.100.1 , 10.0.0.1");
    masuk("admin");
    await expect(login({}, form())).rejects.toThrow();
    expect(header()?.["X-Client-IP"]).toBe("198.51.100.1");
  });
  it("tanpa rahasia: tidak ada header; logout pembeli tidak membawa header", async () => {
    hdrs.set("x-real-ip", "203.0.113.5");
    masuk("customer");
    await login({}, form());
    expect(header()).toBeUndefined();
    vi.stubEnv("INTERNAL_API_SECRET", "s".repeat(32));
    apiFetch.mockClear(); masuk("customer");
    await login({}, form());
    expect(apiFetch.mock.calls[1][1]).not.toHaveProperty("headers");
  });
});

describe("F11 lupa sandi", () => {
  it("mintaKodeReset -> POST /auth/password/forgot", async () => {
    apiFetch.mockResolvedValue({ ok: true, status: 200, data: { message: "x" } });
    expect(await mintaKodeReset("a@b.id")).toEqual({ ok: true });
    expect(apiFetch).toHaveBeenCalledWith("/auth/password/forgot", expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "a@b.id" }) }));
  });
  it("resetKataSandi: galat kode diteruskan ke form", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 400, error: { code: "VALIDATION_ERROR", message: "Data tidak valid.", fields: { code: ["Kode salah atau sudah kedaluwarsa."] } } });
    expect(await resetKataSandi({ email: "a@b.id", code: "123456", password: "baru12345" }))
      .toEqual({ error: "Data tidak valid.", code: "VALIDATION_ERROR", fields: { code: ["Kode salah atau sudah kedaluwarsa."] } });
  });
});
