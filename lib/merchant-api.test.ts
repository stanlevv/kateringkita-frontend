import { describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));
vi.mock("@/lib/session", () => ({ getSessionToken: async () => "tok" }));
vi.mock("next/navigation", () => ({ redirect: (to: string): never => { throw new Error(`REDIRECT ${to}`); } }));

describe("merchantFetch", () => {
  it("memanggil /merchant<path> dengan token sesi dan mengembalikan hasilnya", async () => {
    const hasil = { ok: true, status: 200, data: { x: 1 } };
    apiFetch.mockResolvedValue(hasil);
    const { merchantFetch } = await import("./merchant-api");
    expect(await merchantFetch("/profile")).toBe(hasil);
    expect(apiFetch).toHaveBeenCalledWith("/merchant/profile", { token: "tok" });
  });
  it("method dan body diteruskan bersama token", async () => {
    apiFetch.mockResolvedValue({ ok: true, status: 200, data: {} });
    const { merchantFetch } = await import("./merchant-api");
    await merchantFetch("/profile", { method: "PATCH", body: "{}" });
    expect(apiFetch).toHaveBeenLastCalledWith("/merchant/profile", { method: "PATCH", body: "{}", token: "tok" });
  });
  it("401 -> redirect ke login", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401, error: { code: "UNAUTHENTICATED", message: "x" } });
    const { merchantFetch } = await import("./merchant-api");
    await expect(merchantFetch("/profile")).rejects.toThrow("REDIRECT /login?alasan=sesi-habis");
  });
});
