import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
const getSession = vi.fn();
vi.mock("@/services/authService", () => ({ getSession: () => getSession() }));
const getTransactions = vi.fn();
vi.mock("@/services/reportService", () => ({ getTransactions: (...a: unknown[]) => getTransactions(...a) }));
import { tanggalWib } from "@/lib/format";
import { GET } from "./route";

const hariIni = tanggalWib(new Date().toISOString());
const minta = (q: string) => GET(new Request(`http://localhost/api/laporan/csv${q}`));

const baris = { code: "KK-20261031-AB2C", created_at: "2026-10-30T10:00:00.000Z", completed_at: "2026-10-31T04:42:00.000Z", customer_name: "Rafli", payment_method: "cod", menu_name: "Nasi Ayam", qty: 2, total: 44000, hpp_total: 28000, status: "completed" };
beforeEach(() => {
  getSession.mockResolvedValue({ user: { role: "merchant" }, merchant: {} });
  getTransactions.mockResolvedValue({ data: [baris] });
});

describe("LP-N4 rute CSV", () => {
  it("text/csv, header kolom, nama file laporan-<dari>-<sampai>.csv", async () => {
    const res = await minta(`?dari=${hariIni}&sampai=${hariIni}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBe(`attachment; filename="laporan-${hariIni}-${hariIni}.csv"`);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const isi = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await res.arrayBuffer()); // text() membuang BOM
    expect(isi.startsWith("﻿")).toBe(true);
    const rows = isi.slice(1).trim().split("\r\n");
    expect(rows[0]).toBe("kode,waktu,menu,qty,omzet,hpp,laba,metode");
    expect(rows[1]).toBe("KK-20261031-AB2C,2026-10-31 11:42,Nasi Ayam,2,44000,28000,16000,cod");
    expect(getTransactions).toHaveBeenCalledWith({ from: hariIni, to: hariIni });
  });
  it("galat dari API -> 500 dengan pesan server", async () => {
    getTransactions.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
    const res = await minta(`?dari=${hariIni}&sampai=${hariIni}`);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Dari server" });
  });
  it("LP-E1 rentang tidak sah -> 400 dengan pesan Indonesia", async () => {
    const res = await minta(`?dari=${hariIni}&sampai=2020-01-01`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Tanggal akhir harus setelah tanggal awal." });
    expect((await minta("?dari=2020-01-01&sampai=2026-10-31")).status).toBe(400);
    expect((await minta("")).status).toBe(400);
  });
  it("backend sesi gagal -> 503 dengan pesan Indonesia", async () => {
    getSession.mockImplementation(async () => { throw new Error("boom"); });
    const res = await minta(`?dari=${hariIni}&sampai=${hariIni}`);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ message: "Server tidak dapat dihubungi. Coba lagi sesaat lagi." });
  });
  it("tanpa sesi penjual -> 401", async () => {
    getSession.mockResolvedValue(null);
    expect((await minta(`?dari=${hariIni}&sampai=${hariIni}`)).status).toBe(401);
    getSession.mockResolvedValue({ user: { role: "customer" }, merchant: null });
    expect((await minta(`?dari=${hariIni}&sampai=${hariIni}`)).status).toBe(401);
  });
});
