import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
const getSession = vi.fn();
vi.mock("@/services/authService", () => ({ getSession: () => getSession() }));
const getRekapKeuangan = vi.fn();
vi.mock("@/services/adminKeuanganService", () => ({ getRekapKeuangan: (...a: unknown[]) => getRekapKeuangan(...a) }));
import { tanggalWib } from "@/lib/format";
import { GET } from "./route";

const hariIni = tanggalWib(new Date().toISOString());
const minta = (q: string) => GET(new Request(`http://localhost/api/admin/keuangan/csv${q}`));
const angka = { orders: 2, subtotal: 30000, discount_merchant: 2000, discount_platform: 1000, service_fee: 2000, total: 29000, merchant_net: 28000, platform_net: 1000 };

beforeEach(() => {
  getSession.mockResolvedValue({ user: { role: "admin" }, merchant: null });
  getRekapKeuangan.mockResolvedValue({ data: { rows: [{ merchant_id: 1, business_name: "=Dapur, Siti", ...angka }], totals: angka } });
});

describe("F20 CSV keuangan", () => {
  it("BOM + header + baris toko (aman dari rumus) + baris TOTAL", async () => {
    const res = await minta(`?dari=${hariIni}&sampai=${hariIni}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe(`attachment; filename="keuangan-${hariIni}-${hariIni}.csv"`);
    const isi = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await res.arrayBuffer());
    expect(isi.startsWith("﻿")).toBe(true);
    expect(isi.slice(1).trim().split("\r\n")).toEqual([
      "toko,pesanan,subtotal,diskon_toko,diskon_platform,biaya_layanan,total,pendapatan_toko,pendapatan_platform",
      `"'=Dapur, Siti",2,30000,2000,1000,2000,29000,28000,1000`,
      "TOTAL,2,30000,2000,1000,2000,29000,28000,1000",
    ]);
    expect(getRekapKeuangan).toHaveBeenCalledWith({ from: hariIni, to: hariIni });
  });
  it("bukan admin -> 401; rentang salah -> 400; API gagal -> 500", async () => {
    getSession.mockResolvedValue({ user: { role: "merchant" }, merchant: {} });
    expect((await minta(`?dari=${hariIni}&sampai=${hariIni}`)).status).toBe(401);
    getSession.mockResolvedValue({ user: { role: "admin" }, merchant: null });
    expect((await minta("?dari=x&sampai=y")).status).toBe(400);
    getRekapKeuangan.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
    expect((await minta(`?dari=${hariIni}&sampai=${hariIni}`)).status).toBe(500);
  });
});
