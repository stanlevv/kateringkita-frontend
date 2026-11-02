import { describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));
vi.mock("@/lib/session", () => ({ getSessionToken: async () => "tok" }));
vi.mock("next/navigation", () => ({ redirect: (to: string): never => { throw new Error(`REDIRECT ${to}`); } }));

describe("adminFetch", () => {
  it("memanggil /admin<path> dengan token sesi dan mengembalikan hasilnya (termasuk meta)", async () => {
    const hasil = { ok: true, status: 200, data: [1], meta: { page: 1, limit: 20, total: 1 } };
    apiFetch.mockResolvedValue(hasil);
    const { adminFetch } = await import("./api");
    expect(await adminFetch("/audit-logs?page=1")).toBe(hasil);
    expect(apiFetch).toHaveBeenCalledWith("/admin/audit-logs?page=1", { token: "tok" });
  });
  it("401 (sesi habis di tengah jalan) -> redirect ke login", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401, error: { code: "UNAUTHENTICATED", message: "x" } });
    const { adminFetch } = await import("./api");
    await expect(adminFetch("/summary")).rejects.toThrow("REDIRECT /login?alasan=sesi-habis");
  });
});
