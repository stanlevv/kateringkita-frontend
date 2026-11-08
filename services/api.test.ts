import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/authService", () => ({ getSessionToken: async () => "tok" }));
vi.mock("next/navigation", () => ({ redirect: (to: string): never => { throw new Error(`REDIRECT ${to}`); } }));

// merchantFetch/adminFetch satu berkas dengan apiFetch, jadi apiFetch tak bisa di-mock: yang diamati adalah panggilan fetch-nya.
const fetchMock = vi.fn();
const balas = (status: number, body: unknown) => fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
const panggilan = () => {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit & { headers: Record<string, string> }];
  return { url, init };
};

beforeEach(() => {
  vi.stubEnv("BACKEND_API_URL", "http://be.test");
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("merchantFetch", () => {
  it("memanggil /merchant<path> dengan token sesi dan mengembalikan hasilnya", async () => {
    balas(200, { data: { x: 1 } });
    const { merchantFetch } = await import("./api");
    expect(await merchantFetch("/profile")).toEqual({ ok: true, status: 200, data: { x: 1 } });
    const { url, init } = panggilan();
    expect(url).toBe("http://be.test/merchant/profile");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });
  it("method dan body diteruskan bersama token", async () => {
    balas(200, { data: {} });
    const { merchantFetch } = await import("./api");
    await merchantFetch("/profile", { method: "PATCH", body: "{}" });
    const { url, init } = panggilan();
    expect(url).toBe("http://be.test/merchant/profile");
    expect(init).toMatchObject({ method: "PATCH", body: "{}" });
    expect(init.headers.Authorization).toBe("Bearer tok");
  });
  it("401 -> redirect ke login", async () => {
    balas(401, { error: { code: "UNAUTHENTICATED", message: "x" } });
    const { merchantFetch } = await import("./api");
    await expect(merchantFetch("/profile")).rejects.toThrow("REDIRECT /login?alasan=sesi-habis");
  });
});

describe("adminFetch", () => {
  it("memanggil /admin<path> dengan token sesi dan mengembalikan hasilnya (termasuk meta)", async () => {
    const meta = { page: 1, limit: 20, total: 1 };
    balas(200, { data: [1], meta });
    const { adminFetch } = await import("./api");
    expect(await adminFetch("/audit-logs?page=1")).toEqual({ ok: true, status: 200, data: [1], meta });
    const { url, init } = panggilan();
    expect(url).toBe("http://be.test/admin/audit-logs?page=1");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });
  it("401 (sesi habis di tengah jalan) -> redirect ke login", async () => {
    balas(401, { error: { code: "UNAUTHENTICATED", message: "x" } });
    const { adminFetch } = await import("./api");
    await expect(adminFetch("/summary")).rejects.toThrow("REDIRECT /login?alasan=sesi-habis");
  });
});
