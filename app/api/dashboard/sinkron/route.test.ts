// Test route handler /api/dashboard/sinkron: `sejak` tidak sah -> 400 tanpa memanggil backend, sukses -> 200 tanpa cache,
// galat backend -> 503, dan sesi diperiksa sebelum mengambil data. Services dipalsukan (vi.mock).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireMerchant: () => requireMerchant() }));
const getChangedOrders = vi.fn();
vi.mock("@/services/order.service", () => ({ getChangedOrders: (since: string) => getChangedOrders(since) }));
const getMenus = vi.fn();
vi.mock("@/services/menu.service", () => ({ getMenus: () => getMenus() }));
import { GET } from "./route";

const callRoute = (query: string) => GET(new NextRequest(`http://localhost/api/dashboard/sinkron${query}`));
const SINCE = "2026-11-01T03:00:00.000Z";

beforeEach(() => {
  requireMerchant.mockReset().mockResolvedValue({});
  getChangedOrders.mockReset().mockResolvedValue({ data: [{ code: "A" }] });
  getMenus.mockReset().mockResolvedValue({ data: [{ id: 1 }] });
});

describe("GET /api/dashboard/sinkron", () => {
  it.each(["", "?sejak=kemarin", "?sejak=2026-11-01T03:00:00"])(
    "sejak tidak valid (%s) -> 400 tanpa fetch",
    async (query) => {
      const response = await callRoute(query);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: { code: "VALIDATION_ERROR", message: "Data tidak valid." } });
      expect(getChangedOrders).not.toHaveBeenCalled();
      expect(getMenus).not.toHaveBeenCalled();
    },
  );
  it("sukses -> 200 { data: { orders, menus } } + no-store", async () => {
    const response = await callRoute(`?sejak=${encodeURIComponent(SINCE)}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ data: { orders: [{ code: "A" }], menus: [{ id: 1 }] } });
    expect(getChangedOrders).toHaveBeenCalledWith(SINCE);
  });
  it("getChangedOrders galat -> 503 { error }", async () => {
    getChangedOrders.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } });
    const response = await callRoute(`?sejak=${encodeURIComponent(SINCE)}`);
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." },
    });
  });
  it("getMenus galat -> 503", async () => {
    getMenus.mockResolvedValue({ error: { code: "X", message: "x" } });
    expect((await callRoute(`?sejak=${encodeURIComponent(SINCE)}`)).status).toBe(503);
  });
  it("requireMerchant dipanggil sebelum fetch; melempar -> handler melempar tanpa fetch", async () => {
    requireMerchant.mockRejectedValue(new Error("REDIRECT:/login?alasan=sesi-habis"));
    await expect(callRoute(`?sejak=${encodeURIComponent(SINCE)}`)).rejects.toThrow("REDIRECT:/login?alasan=sesi-habis");
    expect(getChangedOrders).not.toHaveBeenCalled();
    expect(getMenus).not.toHaveBeenCalled();
  });
});
