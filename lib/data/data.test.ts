import { afterEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (n === "kk_skenario" && jar.value ? { name: n, value: jar.value } : undefined),
  }),
}));

const merchantFetch = vi.fn();
vi.mock("@/lib/merchant-api", () => ({ merchantFetch: (...a: unknown[]) => merchantFetch(...a) }));
const apiFetch = vi.fn();
vi.mock("@/lib/api", async (orig) => ({ ...(await orig<typeof import("@/lib/api")>()), apiFetch: (...a: unknown[]) => apiFetch(...a) }));
import { profile } from "../fixtures/profile";
import { categories, pickupPoints } from "../fixtures/meta";
import { menus } from "../fixtures/menus";

import { getMenu, getMenus } from "./menus";
import { orders } from "../fixtures/orders";
import { getAntrean, getJumlahTindakan, getOrder, getOrders, getPerubahan } from "./orders";
import { getProfile } from "./profile";
import { getHourly, getReportSummary, getTransactions } from "./reports";
import { getPromos } from "./promos";
import { getReviews } from "./reviews";
import { getPickupPoints, getCategories } from "./meta";

const ERR = { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
const set = (v?: string) => {
  vi.stubEnv("NODE_ENV", "development");
  jar.value = v;
  merchantFetch.mockImplementation(async (path: string) => {
    if (path.startsWith("/orders/")) return { ok: true, status: 200, data: orders()[0] };
    if (path.startsWith("/orders")) return { ok: true, status: 200, data: orders().slice(0, 2), meta: { page: 1, limit: 20, total: 2 } };
    return { ok: true, status: 200, data: path === "/menus" ? menus() : path.startsWith("/menus/") ? menus()[0] : profile() };
  });
  apiFetch.mockImplementation(async (path: string) => ({ ok: true, status: 200, data: path === "/meta/categories" ? categories() : pickupPoints() }));
};
afterEach(() => {
  merchantFetch.mockReset();
  apiFetch.mockReset();
  vi.unstubAllEnvs();
  jar.value = undefined;
});

describe("lib/data", () => {
  it("tanpa skenario mengembalikan { data }", async () => {
    set();
    const r = await getMenus();
    expect("data" in r && r.data.length).toBeGreaterThan(0);
  });
  it("getMenus: GET /menus dari backend apa adanya; 500 -> pesan backend", async () => {
    set();
    expect(await getMenus()).toEqual({ data: menus() });
    expect(merchantFetch).toHaveBeenCalledWith("/menus");
    merchantFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "INTERNAL_ERROR", message: "Dari server" } });
    expect(await getMenus()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
  });
  it("getMenu: GET /menus/:id; 404 -> NOT_FOUND", async () => {
    set();
    expect(await getMenu(1)).toMatchObject({ data: { id: 1 } });
    expect(merchantFetch).toHaveBeenCalledWith("/menus/1");
    merchantFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "Menu tidak ditemukan." } });
    expect(await getMenu(9)).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
  it("getCategories: GET /meta/categories tanpa token", async () => {
    set();
    expect(await getCategories()).toEqual({ data: categories() });
    expect(apiFetch).toHaveBeenCalledWith("/meta/categories");
  });
  it("gagal-muat: semua baca mengembalikan error", async () => {
    set("gagal-muat");
    const R = { from: "2026-10-25", to: "2026-10-31" };
    for (const f of [() => getReportSummary(R), () => getHourly({ date: R.to }), () => getTransactions(R)]) expect(await f()).toEqual(ERR);
    const fns = [getMenus, getOrders, getAntrean, getProfile, getPromos, getReviews, getPickupPoints, getCategories];
    for (const f of fns) expect(await f()).toEqual(ERR);
  });
  it("kosong: daftar kosong", async () => {
    set("kosong");
    merchantFetch.mockClear();
    expect(await getMenus()).toMatchObject({ data: [] });
    expect(merchantFetch).not.toHaveBeenCalled();
    expect(await getOrders()).toMatchObject({ data: { rows: [], total: 0 } });
    expect(await getAntrean()).toEqual({ data: [] });
    expect(await getJumlahTindakan()).toBe(0);
    expect(merchantFetch).not.toHaveBeenCalled();
    expect(await getPromos()).toMatchObject({ data: [] });
    expect(await getReviews()).toMatchObject({ data: [] });
  });
  it("laporan: rentang jumlahnya konsisten; kosong -> nol (LP-S1)", async () => {
    set();
    const R = { from: "2026-10-25", to: "2026-10-31" };
    const [s, t, h] = await Promise.all([getReportSummary(R), getTransactions(R), getHourly({ date: "2026-10-31" })]);
    if (!("data" in s && "data" in t && "data" in h)) throw new Error("harus data");
    expect(s.data.revenue).toBe(t.data.reduce((a, x) => a + x.total, 0));
    expect(h.data.reduce((a, x) => a + x.orders, 0)).toBe(t.data.filter((x) => x.code.startsWith("KK-20261031")).length);
    set("kosong");
    expect(await getReportSummary(R)).toMatchObject({ data: { revenue: 0, hpp_total: 0, profit: 0 } });
    expect(await getTransactions(R)).toMatchObject({ data: [] });
    expect(await getHourly({ date: R.to })).toMatchObject({ data: [] });
  });
  it("dapur-tutup", async () => {
    set("dapur-tutup");
    expect(await getProfile()).toMatchObject({ data: { is_open: false } });
  });
  it("luar-jam: sekarang (WIB) di luar open/close", async () => {
    set("luar-jam");
    const r = await getProfile();
    if (!("data" in r)) throw new Error("harus data");
    const wib = new Date(Date.now() + 7 * 3600e3);
    const now = wib.getUTCHours() * 60 + wib.getUTCMinutes();
    const m = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
    expect(now < m(r.data.open_time) || now > m(r.data.close_time)).toBe(true);
  });
  it("getProfile membaca /profile dari backend apa adanya", async () => {
    set();
    const p = { ...profile(), business_name: "Dari Server" };
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: p });
    expect(await getProfile()).toEqual({ data: p });
    expect(merchantFetch).toHaveBeenCalledWith("/profile");
  });
  it("getProfile: backend 500 -> { error } pesan backend", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "INTERNAL_ERROR", message: "Dari server" } });
    expect(await getProfile()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
  });
  it("getPickupPoints: GET /meta/pickup-points tanpa token", async () => {
    set();
    expect(await getPickupPoints()).toEqual({ data: pickupPoints() });
    expect(apiFetch).toHaveBeenCalledWith("/meta/pickup-points");
  });
  it("getPickupPoints: penjual-baru -> kosong", async () => {
    set("penjual-baru");
    expect(await getPickupPoints()).toEqual({ data: [] });
  });
  it("penjual-baru: tanpa menu, titik temu, pesanan", async () => {
    set("penjual-baru");
    expect(await getMenus()).toMatchObject({ data: [] });
    expect(await getOrders()).toMatchObject({ data: { rows: [], total: 0 } });
    expect(await getProfile()).toMatchObject({ data: { pickup_point_ids: [] } });
  });
  it("getOrders: query dari filter, total dari meta, galat diteruskan", async () => {
    set();
    const rows = orders().slice(0, 3);
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: rows, meta: { page: 2, limit: 20, total: 41 } });
    const r = await getOrders({ status: "ready", tanggal: "2026-11-01", q: "rina", page: 2 });
    expect(merchantFetch).toHaveBeenCalledWith("/orders?status=ready&date=2026-11-01&q=rina&page=2&limit=20");
    expect(r).toEqual({ data: { rows, total: 41 } });
    merchantFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "INTERNAL_ERROR", message: "Dari server" } });
    expect(await getOrders()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
  });
  it("getAntrean: aktif + hari ini, kode sama sekali; galat salah satu -> error", async () => {
    set();
    const hari = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    const a = orders();
    merchantFetch.mockImplementation(async (path: string) => ({ ok: true, status: 200, data: path.includes("date=") ? [a[0], a[1]] : [a[1], a[2]] }));
    const r = await getAntrean();
    expect(merchantFetch).toHaveBeenCalledWith("/orders?status=holding,confirmed,cooking,ready&limit=100");
    expect(merchantFetch).toHaveBeenCalledWith(`/orders?date=${hari}&limit=100`);
    expect("data" in r && r.data.map((o) => o.code).sort()).toEqual([a[0].code, a[1].code, a[2].code].sort());
    merchantFetch.mockImplementation(async (path: string) => path.includes("date=") ? { ok: false, status: 500, error: { code: "X", message: "x" } } : { ok: true, status: 200, data: [] });
    expect(await getAntrean()).toEqual({ error: { code: "X", message: "x" } });
  });
  it("getAntrean: pesanan-baru menumpuk satu pesanan holding dibuat sekarang", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: [] });
    set("pesanan-baru");
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: [] });
    const r = await getAntrean();
    if (!("data" in r)) throw new Error("data");
    expect(r.data).toHaveLength(1);
    expect(r.data[0].status).toBe("holding");
    expect(Math.abs(Date.now() - Date.parse(r.data[0].created_at))).toBeLessThan(5000);
  });
  it("getJumlahTindakan: meta.total dari holding,confirmed; galat -> 0", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: [], meta: { page: 1, limit: 1, total: 7 } });
    expect(await getJumlahTindakan()).toBe(7);
    expect(merchantFetch).toHaveBeenCalledWith("/orders?status=holding,confirmed&limit=1");
    merchantFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "X", message: "x" } });
    expect(await getJumlahTindakan()).toBe(0);
  });
  it("getOrder (PS-E1): GET /orders/:code, NOT_FOUND dan gagal-muat", async () => {
    set();
    expect(await getOrder("KK-20261031-7QF2")).toMatchObject({ data: { code: "KK-20261031-7QF2" } });
    expect(merchantFetch).toHaveBeenCalledWith("/orders/KK-20261031-7QF2");
    merchantFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan." } });
    expect(await getOrder("KK/ANEH")).toMatchObject({ error: { code: "NOT_FOUND" } });
    expect(merchantFetch).toHaveBeenLastCalledWith("/orders/KK%2FANEH");
  });
});

describe("D4 getPerubahan (M-04)", () => {
  const SEJAK = "2026-11-01T03:00:00.000Z";
  const baris = (n: number, akhir: string, awalan = "K") =>
    Array.from({ length: n }, (_, i) => ({ ...orders()[0], code: `${awalan}${i}`, updated_at: i === n - 1 ? akhir : SEJAK }));
  const q = (sejak: string) => `/orders?${new URLSearchParams({ updated_since: sejak, limit: "100" })}`;

  it("memanggil /orders?updated_since&limit=100; < 100 baris -> satu panggilan", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: baris(2, "2026-11-01T03:01:00.000Z") });
    expect(await getPerubahan(SEJAK)).toMatchObject({ data: [{ code: "K0" }, { code: "K1" }] });
    expect(merchantFetch).toHaveBeenCalledWith("/orders?updated_since=2026-11-01T03%3A00%3A00.000Z&limit=100");
    expect(merchantFetch).toHaveBeenCalledTimes(1);
  });
  it("100 baris -> maju dengan updated_at terbesar; kode sama muncul sekali (versi terakhir)", async () => {
    set();
    const T2 = "2026-11-01T03:05:00.000Z";
    merchantFetch
      .mockResolvedValueOnce({ ok: true, status: 200, data: baris(100, T2) })
      .mockResolvedValueOnce({ ok: true, status: 200, data: [{ ...orders()[0], code: "K0", updated_at: T2, status: "confirmed" }] });
    const r = await getPerubahan(SEJAK);
    expect(merchantFetch).toHaveBeenNthCalledWith(2, q(T2));
    if (!("data" in r)) throw new Error("galat");
    expect(r.data).toHaveLength(100);
    expect(r.data.filter((o) => o.code === "K0")).toEqual([expect.objectContaining({ status: "confirmed" })]);
  });
  it("100 baris dengan terbesar = sejak -> berhenti", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: baris(100, SEJAK) });
    await getPerubahan(SEJAK);
    expect(merchantFetch).toHaveBeenCalledTimes(1);
  });
  it("selalu 100 baris naik -> tepat 5 panggilan", async () => {
    set();
    let n = 0;
    merchantFetch.mockImplementation(async () => ({ ok: true, status: 200, data: baris(100, new Date(Date.parse(SEJAK) + ++n * 1000).toISOString(), `P${n}-`) }));
    await getPerubahan(SEJAK);
    expect(merchantFetch).toHaveBeenCalledTimes(5);
  });
  it("galat backend -> { error }", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "INTERNAL_ERROR", message: "Dari server" } });
    expect(await getPerubahan(SEJAK)).toEqual({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
  });
  it("skenario: kosong -> [] tanpa fetch; gagal-sinkron & gagal-muat -> error", async () => {
    set("kosong");
    merchantFetch.mockClear();
    expect(await getPerubahan(SEJAK)).toEqual({ data: [] });
    expect(merchantFetch).not.toHaveBeenCalled();
    for (const s of ["gagal-sinkron", "gagal-muat"]) {
      set(s);
      expect(await getPerubahan(SEJAK)).toEqual(ERR);
    }
  });
});

describe("D2 data contoh dashboard dihapus (DS-10)", () => {
  it("tidak ada getDashboard / DashboardSummary / omzetHariIni di fe", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const akar = join(__dirname, "..", "..");
    const temuan: string[] = [];
    const jelajah = (d: string) => {
      for (const n of readdirSync(d)) {
        if (["node_modules", ".next", "docs"].includes(n)) continue;
        const p = join(d, n);
        if (statSync(p).isDirectory()) jelajah(p);
        else if (/\.(ts|tsx)$/.test(n) && !p.endsWith("data.test.ts") && /getDashboard|DashboardSummary|omzetHariIni/.test(readFileSync(p, "utf8"))) temuan.push(p);
      }
    };
    for (const d of ["app", "components", "lib"]) jelajah(join(akar, d));
    expect(temuan).toEqual([]);
  });
});
