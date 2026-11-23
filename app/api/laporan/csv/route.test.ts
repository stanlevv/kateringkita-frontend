// Test route handler /api/laporan/csv: isi dan nama file CSV, galat backend, rentang tanggal tidak sah, server sesi
// mati, tanpa sesi penjual, dan permintaan dari situs lain. Sesi dan getTransactions dipalsukan (vi.mock).
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
const getSession = vi.fn();
vi.mock("@/services/auth.service", () => ({ getSession: () => getSession() }));
const getTransactions = vi.fn();
vi.mock("@/services/report.service", () => ({ getTransactions: (...args: unknown[]) => getTransactions(...args) }));
import { wibDate } from "@/lib/format";
import { GET } from "./route";

const today = wibDate(new Date().toISOString());
const callRoute = (query: string) => GET(new Request(`http://localhost/api/laporan/csv${query}`));

const row = {
  code: "KK-20261031-AB2C",
  created_at: "2026-10-30T10:00:00.000Z",
  completed_at: "2026-10-31T04:42:00.000Z",
  customer_name: "Rafli",
  payment_method: "cod",
  menu_name: "Nasi Ayam",
  qty: 2,
  total: 44000,
  hpp_total: 28000,
  status: "completed",
};
beforeEach(() => {
  getSession.mockResolvedValue({ user: { role: "merchant" }, merchant: {} });
  getTransactions.mockResolvedValue({ data: [row] });
});

describe("LP-N4 rute CSV", () => {
  it("text/csv, header kolom, nama file laporan-<dari>-<sampai>.csv", async () => {
    const response = await callRoute(`?dari=${today}&sampai=${today}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe(`attachment; filename="laporan-${today}-${today}.csv"`);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const csvText = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await response.arrayBuffer()); // text() membuang BOM
    expect(csvText.startsWith("﻿")).toBe(true);
    const rows = csvText.slice(1).trim().split("\r\n");
    expect(rows[0]).toBe("kode,waktu,menu,qty,omzet,hpp,laba,metode");
    expect(rows[1]).toBe("KK-20261031-AB2C,2026-10-31 11:42,Nasi Ayam,2,44000,28000,16000,cod");
    expect(getTransactions).toHaveBeenCalledWith({ from: today, to: today });
  });
  it("galat dari API -> 500 dengan pesan server", async () => {
    getTransactions.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
    const response = await callRoute(`?dari=${today}&sampai=${today}`);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Dari server" });
  });
  it("LP-E1 rentang tidak sah -> 400 dengan pesan Indonesia", async () => {
    const response = await callRoute(`?dari=${today}&sampai=2020-01-01`);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Tanggal akhir harus setelah tanggal awal." });
    expect((await callRoute("?dari=2020-01-01&sampai=2026-10-31")).status).toBe(400);
    expect((await callRoute("")).status).toBe(400);
  });
  it("backend sesi gagal -> 503 dengan pesan Indonesia", async () => {
    getSession.mockImplementation(async () => {
      throw new Error("boom");
    });
    const response = await callRoute(`?dari=${today}&sampai=${today}`);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Server tidak dapat dihubungi. Coba lagi sesaat lagi." });
  });
  it("tanpa sesi penjual -> 401", async () => {
    getSession.mockResolvedValue(null);
    expect((await callRoute(`?dari=${today}&sampai=${today}`)).status).toBe(401);
    getSession.mockResolvedValue({ user: { role: "customer" }, merchant: null });
    expect((await callRoute(`?dari=${today}&sampai=${today}`)).status).toBe(401);
  });
});

// Navigasi dari situs lain dengan sesi valid dijawab sama persis dengan tanpa sesi (tidak membocorkan siapa yang login)
describe("XS-Leak", () => {
  it.each(["cross-site", "same-site", "none"])(
    "sec-fetch-site %s -> 401 seperti tanpa sesi, sesi tidak dibaca",
    async (fetchSite) => {
      getSession.mockClear();
      const response = await GET(
        new Request(`http://localhost/api/laporan/csv?dari=${today}&sampai=${today}`, {
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
      new Request(`http://localhost/api/laporan/csv?dari=${today}&sampai=${today}`, {
        headers: { "sec-fetch-site": "same-origin" },
      }),
    );
    expect(response.status).toBe(200);
  });
});
