// Test server action auth (app/actions/auth.ts): tujuan setelah login per peran, IP pengunjung ke backend, dan lupa kata sandi.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((target: string) => {
  throw new Error(`REDIRECT ${target}`);
});
const setCookie = vi.fn();
const apiFetch = vi.fn();
vi.mock("next/navigation", () => ({ redirect: (target: string) => redirect(target) }));
const requestHeaders = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: setCookie }),
  headers: async () => ({ get: (key: string) => requestHeaders.get(key) ?? null }),
}));
vi.mock("@/services/api", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));
vi.mock("@/services/auth.service", () => ({ SESSION_COOKIE: "kk_session", getSessionToken: async () => undefined }));

import { login, registerMerchant, requestResetCode, resetPassword } from "./auth";

const mockLoginAs = (role: string) =>
  apiFetch.mockResolvedValue({
    ok: true,
    status: 200,
    data: { token: "tok", expires_at: "2030-01-01T00:00:00Z", user: { role } },
  });
const buildLoginForm = (next?: string) => {
  const formData = new FormData();
  formData.set("identifier", "a@b.id");
  formData.set("password", "x");
  if (next !== undefined) formData.set("next", next);
  return formData;
};

beforeEach(() => {
  requestHeaders.clear();
  vi.unstubAllEnvs();
  apiFetch.mockReset();
  redirect.mockClear();
  setCookie.mockClear();
});

describe("login web per role", () => {
  it("admin -> /admin", async () => {
    mockLoginAs("admin");
    await expect(login({}, buildLoginForm())).rejects.toThrow("REDIRECT /admin");
    expect(setCookie).toHaveBeenCalled();
  });
  it("admin dengan next=/dashboard -> /admin", async () => {
    mockLoginAs("admin");
    await expect(login({}, buildLoginForm("/dashboard"))).rejects.toThrow("REDIRECT /admin");
  });
  it("admin dengan next=/admin/verifikasi -> /admin/verifikasi", async () => {
    mockLoginAs("admin");
    await expect(login({}, buildLoginForm("/admin/verifikasi"))).rejects.toThrow("REDIRECT /admin/verifikasi");
  });
  it("admin dengan next=/adminx atau //evil -> /admin", async () => {
    mockLoginAs("admin");
    await expect(login({}, buildLoginForm("/adminx"))).rejects.toThrow("REDIRECT /admin");
    await expect(login({}, buildLoginForm("//evil.com"))).rejects.toThrow("REDIRECT /admin");
  });
  it("penjual -> /dashboard", async () => {
    mockLoginAs("merchant");
    await expect(login({}, buildLoginForm())).rejects.toThrow("REDIRECT /dashboard");
  });
  it("penjual dengan next=/admin... -> /dashboard; next lain tetap dipakai", async () => {
    mockLoginAs("merchant");
    await expect(login({}, buildLoginForm("/admin"))).rejects.toThrow(/^REDIRECT \/dashboard$/);
    await expect(login({}, buildLoginForm("/admin/verifikasi"))).rejects.toThrow(/^REDIRECT \/dashboard$/);
    await expect(login({}, buildLoginForm("/menu"))).rejects.toThrow(/^REDIRECT \/menu$/);
  });
  it("pembeli ditolak, token dicabut, tanpa cookie", async () => {
    mockLoginAs("customer");
    const result = await login({}, buildLoginForm());
    expect(result.code).toBe("NOT_MERCHANT");
    expect(setCookie).not.toHaveBeenCalled();
    expect(apiFetch).toHaveBeenCalledWith("/auth/logout", expect.objectContaining({ token: "tok" }));
  });
});

describe("IP klien ke backend", () => {
  const sentHeaders = () => (apiFetch.mock.calls[0][1] as { headers?: Record<string, string> }).headers;
  it("mengirim X-Client-IP & X-Internal-Secret bila rahasia diisi (x-real-ip diutamakan)", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "s".repeat(32));
    requestHeaders.set("x-real-ip", "203.0.113.5");
    requestHeaders.set("x-forwarded-for", "198.51.100.1, 10.0.0.1");
    mockLoginAs("admin");
    await expect(login({}, buildLoginForm())).rejects.toThrow("REDIRECT /admin");
    expect(sentHeaders()).toEqual({ "X-Client-IP": "203.0.113.5", "X-Internal-Secret": "s".repeat(32) });
  });
  it("memakai entri pertama x-forwarded-for bila tanpa x-real-ip", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "s".repeat(32));
    requestHeaders.set("x-forwarded-for", " 198.51.100.1 , 10.0.0.1");
    mockLoginAs("admin");
    await expect(login({}, buildLoginForm())).rejects.toThrow();
    expect(sentHeaders()?.["X-Client-IP"]).toBe("198.51.100.1");
  });
  it("tanpa rahasia: tidak ada header; logout pembeli tidak membawa header", async () => {
    requestHeaders.set("x-real-ip", "203.0.113.5");
    mockLoginAs("customer");
    await login({}, buildLoginForm());
    expect(sentHeaders()).toBeUndefined();
    vi.stubEnv("INTERNAL_API_SECRET", "s".repeat(32));
    apiFetch.mockClear();
    mockLoginAs("customer");
    await login({}, buildLoginForm());
    expect(apiFetch.mock.calls[1][1]).not.toHaveProperty("headers");
  });
});

describe("lupa sandi", () => {
  it("requestResetCode -> POST /auth/password/forgot", async () => {
    apiFetch.mockResolvedValue({ ok: true, status: 200, data: { message: "x" } });
    expect(await requestResetCode("a@b.id")).toEqual({ ok: true });
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/password/forgot",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "a@b.id" }) }),
    );
  });
  it("resetPassword: galat kode diteruskan ke form", async () => {
    apiFetch.mockResolvedValue({
      ok: false,
      status: 400,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data tidak valid.",
        fields: { code: ["Kode salah atau sudah kedaluwarsa."] },
      },
    });
    expect(await resetPassword({ email: "a@b.id", code: "123456", password: "baru12345" })).toEqual({
      error: "Data tidak valid.",
      code: "VALIDATION_ERROR",
      fields: { code: ["Kode salah atau sudah kedaluwarsa."] },
    });
  });
});

describe("daftar penjual: masuk otomatis", () => {
  const buildRegisterForm = () => {
    const formData = new FormData();
    formData.set("phone", " 081234567890 ");
    formData.set("password", "Rahasia123");
    formData.set("full_name", "Budi");
    return formData;
  };
  const registered = { ok: true, status: 201, data: {} };
  const loginOk = (role: string) => ({
    ok: true,
    status: 200,
    data: { token: "tok", expires_at: "2030-01-01T00:00:00Z", user: { role } },
  });

  it("daftar + login penjual -> cookie sesi dan redirect /dashboard", async () => {
    apiFetch.mockResolvedValueOnce(registered).mockResolvedValueOnce(loginOk("merchant"));
    await expect(registerMerchant({}, buildRegisterForm())).rejects.toThrow("REDIRECT /dashboard");
    expect(apiFetch.mock.calls[1][0]).toBe("/auth/login");
    expect(JSON.parse((apiFetch.mock.calls[1][1] as { body: string }).body)).toEqual({
      identifier: "081234567890",
      password: "Rahasia123",
      client: "web",
    });
    expect(setCookie).toHaveBeenCalledWith(
      "kk_session",
      "tok",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: new Date("2030-01-01T00:00:00Z"),
      }),
    );
  });
  it("login otomatis gagal (RATE_LIMITED) -> { ok: true }, tanpa cookie dan redirect", async () => {
    apiFetch
      .mockResolvedValueOnce(registered)
      .mockResolvedValueOnce({ ok: false, status: 429, error: { code: "RATE_LIMITED", message: "x" } });
    await expect(registerMerchant({}, buildRegisterForm())).resolves.toEqual({ ok: true });
    expect(setCookie).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
  it("login otomatis mengembalikan role bukan penjual -> { ok: true }, tanpa cookie", async () => {
    apiFetch.mockResolvedValueOnce(registered).mockResolvedValueOnce(loginOk("customer"));
    await expect(registerMerchant({}, buildRegisterForm())).resolves.toEqual({ ok: true });
    expect(setCookie).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
  it("daftar gagal (CONFLICT) -> galat, /auth/login tidak dipanggil", async () => {
    apiFetch.mockResolvedValueOnce({ ok: false, status: 409, error: { code: "CONFLICT", message: "Sudah dipakai" } });
    await expect(registerMerchant({}, buildRegisterForm())).resolves.toMatchObject({ code: "CONFLICT" });
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(setCookie).not.toHaveBeenCalled();
  });
});
