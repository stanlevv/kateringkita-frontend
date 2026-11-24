// Test route handler /api/admin/keuangan/csv: isi CSV (baris toko aman dari rumus Excel dan baris TOTAL), bukan admin,
// rentang salah, galat backend, dan permintaan dari situs lain. Sesi dan getFinanceSummary dipalsukan (vi.mock).
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
const getSession = vi.fn();
vi.mock("@/services/auth.service", () => ({ getSession: () => getSession() }));
const getFinanceSummary = vi.fn();
vi.mock("@/services/admin-finance.service", () => ({
  getFinanceSummary: (...args: unknown[]) => getFinanceSummary(...args),
}));
import { wibDate } from "@/lib/format";
import { GET } from "./route";

const today = wibDate(new Date().toISOString());
const callRoute = (query: string) => GET(new Request(`http://localhost/api/admin/keuangan/csv${query}`));
const amounts = {
  orders: 2,
  subtotal: 30000,
  discount_merchant: 2000,
  discount_platform: 1000,
  service_fee: 2000,
  total: 29000,
  merchant_net: 28000,
  platform_net: 1000,
};

beforeEach(() => {
  getSession.mockResolvedValue({ user: { role: "admin" }, merchant: null });
  getFinanceSummary.mockResolvedValue({
    data: { rows: [{ merchant_id: 1, business_name: "=Dapur, Siti", ...amounts }], totals: amounts },
  });
});

describe("CSV keuangan", () => {
  it("BOM + header + baris toko (aman dari rumus) + baris TOTAL", async () => {
    const response = await callRoute(`?dari=${today}&sampai=${today}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe(`attachment; filename="keuangan-${today}-${today}.csv"`);
    const csvText = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await response.arrayBuffer());
    expect(csvText.startsWith("﻿")).toBe(true);
    expect(csvText.slice(1).trim().split("\r\n")).toEqual([
      "toko,pesanan,subtotal,diskon_toko,diskon_platform,biaya_layanan,total,pendapatan_toko,pendapatan_platform",
      `"'=Dapur, Siti",2,30000,2000,1000,2000,29000,28000,1000`,
      "TOTAL,2,30000,2000,1000,2000,29000,28000,1000",
    ]);
    expect(getFinanceSummary).toHaveBeenCalledWith({ from: today, to: today });
  });
  it("bukan admin -> 401; rentang salah -> 400; API gagal -> 500", async () => {
    getSession.mockResolvedValue({ user: { role: "merchant" }, merchant: {} });
    expect((await callRoute(`?dari=${today}&sampai=${today}`)).status).toBe(401);
    getSession.mockResolvedValue({ user: { role: "admin" }, merchant: null });
    expect((await callRoute("?dari=x&sampai=y")).status).toBe(400);
    getFinanceSummary.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
    expect((await callRoute(`?dari=${today}&sampai=${today}`)).status).toBe(500);
  });
});

// Navigasi dari situs lain dengan sesi valid dijawab sama persis dengan tanpa sesi (tidak membocorkan siapa yang login)
describe("XS-Leak", () => {
  it.each(["cross-site", "same-site", "none"])(
    "sec-fetch-site %s -> 401 seperti tanpa sesi, sesi tidak dibaca",
    async (fetchSite) => {
      getSession.mockClear();
      const response = await GET(
        new Request(`http://localhost/api/admin/keuangan/csv?dari=${today}&sampai=${today}`, {
          headers: { "sec-fetch-site": fetchSite },
        }),
      );
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: "Sesi berakhir. Masuk lagi untuk mengunduh." });
      expect(getSession).not.toHaveBeenCalled();
    },
  );
  it("same-origin tetap mengunduh", async () => {
    const response = await GET(
      new Request(`http://localhost/api/admin/keuangan/csv?dari=${today}&sampai=${today}`, {
        headers: { "sec-fetch-site": "same-origin" },
      }),
    );
    expect(response.status).toBe(200);
  });
});
