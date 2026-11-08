import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/authService", () => ({ requireMerchant: () => requireMerchant() }));
const getPerubahan = vi.fn();
vi.mock("@/services/orderService", () => ({ getPerubahan: (s: string) => getPerubahan(s) }));
const getMenus = vi.fn();
vi.mock("@/services/menuService", () => ({ getMenus: () => getMenus() }));
import { GET } from "./route";

const minta = (q: string) => GET(new NextRequest(`http://localhost/api/dashboard/sinkron${q}`));
const SEJAK = "2026-11-01T03:00:00.000Z";

beforeEach(() => {
  requireMerchant.mockReset().mockResolvedValue({});
  getPerubahan.mockReset().mockResolvedValue({ data: [{ code: "A" }] });
  getMenus.mockReset().mockResolvedValue({ data: [{ id: 1 }] });
});

describe("D3 GET /api/dashboard/sinkron (M-04)", () => {
  it.each(["", "?sejak=kemarin", "?sejak=2026-11-01T03:00:00"])("sejak tidak valid (%s) -> 400 tanpa fetch", async (q) => {
    const res = await minta(q);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "VALIDATION_ERROR", message: "Data tidak valid." } });
    expect(getPerubahan).not.toHaveBeenCalled();
    expect(getMenus).not.toHaveBeenCalled();
  });
  it("sukses -> 200 { data: { orders, menus } } + no-store", async () => {
    const res = await minta(`?sejak=${encodeURIComponent(SEJAK)}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ data: { orders: [{ code: "A" }], menus: [{ id: 1 }] } });
    expect(getPerubahan).toHaveBeenCalledWith(SEJAK);
  });
  it("getPerubahan galat -> 503 { error }", async () => {
    getPerubahan.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } });
    const res = await minta(`?sejak=${encodeURIComponent(SEJAK)}`);
    expect(res.status).toBe(503);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } });
  });
  it("getMenus galat -> 503", async () => {
    getMenus.mockResolvedValue({ error: { code: "X", message: "x" } });
    expect((await minta(`?sejak=${encodeURIComponent(SEJAK)}`)).status).toBe(503);
  });
  it("requireMerchant dipanggil sebelum fetch; melempar -> handler melempar tanpa fetch", async () => {
    requireMerchant.mockRejectedValue(new Error("REDIRECT:/login?alasan=sesi-habis"));
    await expect(minta(`?sejak=${encodeURIComponent(SEJAK)}`)).rejects.toThrow("REDIRECT:/login?alasan=sesi-habis");
    expect(getPerubahan).not.toHaveBeenCalled();
    expect(getMenus).not.toHaveBeenCalled();
  });
});
