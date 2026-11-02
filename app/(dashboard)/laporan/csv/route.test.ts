import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
const getSession = vi.fn();
vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
import { tanggalWib } from "@/lib/format";
import { GET } from "./route";

const hariIni = tanggalWib(new Date().toISOString());
const minta = (q: string) => GET(new Request(`http://localhost/laporan/csv${q}`));

beforeEach(() => { getSession.mockResolvedValue({ user: { role: "merchant" }, merchant: {} }); });

describe("LP-N4 rute CSV", () => {
  it("text/csv, header kolom, nama file laporan-<dari>-<sampai>.csv", async () => {
    const res = await minta(`?dari=${hariIni}&sampai=${hariIni}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBe(`attachment; filename="laporan-${hariIni}-${hariIni}.csv"`);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const isi = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await res.arrayBuffer()); // text() membuang BOM
    expect(isi.startsWith("﻿")).toBe(true);
    const baris = isi.slice(1).trim().split("\r\n");
    expect(baris[0]).toBe("kode,waktu,menu,qty,omzet,hpp,laba,metode");
    expect(baris.length).toBeGreaterThan(1);
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
