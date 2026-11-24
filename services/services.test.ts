// Test service data penjual: panggilan ke backend dan efek skenario pratinjau.
import { afterEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "kk_skenario" && jar.value ? { name, value: jar.value } : undefined),
  }),
}));

const merchantFetch = vi.fn();
const apiFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  merchantFetch: (...args: unknown[]) => merchantFetch(...args),
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));
import { profile } from "@/lib/fixtures/profile";
import { categories, pickupPoints } from "@/lib/fixtures/meta";
import { menus } from "@/lib/fixtures/menus";

import { getMenu, getMenus } from "@/services/menu.service";
import { orders } from "@/lib/fixtures/orders";
import { getQueue, getNeedsActionCount, getOrder, getOrders, getChangedOrders } from "@/services/order.service";
import { getProfile } from "@/services/profile.service";
import { getHourly, getReportSummary, getTransactions } from "@/services/report.service";
import { getPromos } from "@/services/promo.service";
import { getReviews } from "@/services/review.service";
import { getPickupPoints, getCategories } from "@/services/meta.service";

const ERR = { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
const set = (scenario?: string) => {
  vi.stubEnv("NODE_ENV", "development");
  jar.value = scenario;
  merchantFetch.mockImplementation(async (path: string) => {
    if (path.startsWith("/orders/")) return { ok: true, status: 200, data: orders()[0] };
    if (path.startsWith("/orders"))
      return { ok: true, status: 200, data: orders().slice(0, 2), meta: { page: 1, limit: 20, total: 2 } };
    return {
      ok: true,
      status: 200,
      data: path === "/menus" ? menus() : path.startsWith("/menus/") ? menus()[0] : profile(),
    };
  });
  apiFetch.mockImplementation(async (path: string) => ({
    ok: true,
    status: 200,
    data: path === "/meta/categories" ? categories() : pickupPoints(),
  }));
};
afterEach(() => {
  merchantFetch.mockReset();
  apiFetch.mockReset();
  vi.unstubAllEnvs();
  jar.value = undefined;
});

describe("services", () => {
  it("tanpa skenario mengembalikan { data }", async () => {
    set();
    const result = await getMenus();
    expect("data" in result && result.data.length).toBeGreaterThan(0);
  });
  it("getMenus: GET /menus dari backend apa adanya; 500 -> pesan backend", async () => {
    set();
    expect(await getMenus()).toEqual({ data: menus() });
    expect(merchantFetch).toHaveBeenCalledWith("/menus");
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: "INTERNAL_ERROR", message: "Dari server" },
    });
    expect(await getMenus()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
  });
  it("getMenu: GET /menus/:id; 404 -> NOT_FOUND", async () => {
    set();
    expect(await getMenu(1)).toMatchObject({ data: { id: 1 } });
    expect(merchantFetch).toHaveBeenCalledWith("/menus/1");
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 404,
      error: { code: "NOT_FOUND", message: "Menu tidak ditemukan." },
    });
    expect(await getMenu(9)).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
  it("getCategories: GET /meta/categories tanpa token", async () => {
    set();
    expect(await getCategories()).toEqual({ data: categories() });
    expect(apiFetch).toHaveBeenCalledWith("/meta/categories");
  });
  it("getReviews: GET /merchant/reviews", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: [] });
    expect(await getReviews()).toEqual({ data: [] });
    expect(merchantFetch).toHaveBeenCalledWith("/reviews");
  });
  it("getPromos: GET /merchant/promos", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: [] });
    expect(await getPromos()).toEqual({ data: [] });
    expect(merchantFetch).toHaveBeenCalledWith("/promos");
  });
  it("gagal-muat: semua baca mengembalikan error", async () => {
    set("gagal-muat");
    const RANGE = { from: "2026-10-25", to: "2026-10-31" };
    for (const load of [
      () => getReportSummary(RANGE),
      () => getHourly({ date: RANGE.to }),
      () => getTransactions(RANGE),
    ])
      expect(await load()).toEqual(ERR);
    const loaders = [getMenus, getOrders, getQueue, getProfile, getPromos, getReviews, getPickupPoints, getCategories];
    for (const load of loaders) expect(await load()).toEqual(ERR);
  });
  it("kosong: daftar kosong", async () => {
    set("kosong");
    merchantFetch.mockClear();
    expect(await getMenus()).toMatchObject({ data: [] });
    expect(merchantFetch).not.toHaveBeenCalled();
    expect(await getOrders()).toMatchObject({ data: { rows: [], total: 0 } });
    expect(await getQueue()).toEqual({ data: [] });
    expect(await getNeedsActionCount()).toBe(0);
    expect(merchantFetch).not.toHaveBeenCalled();
    expect(await getPromos()).toMatchObject({ data: [] });
    expect(await getReviews()).toMatchObject({ data: [] });
  });
  it("dapur-tutup", async () => {
    set("dapur-tutup");
    expect(await getProfile()).toMatchObject({ data: { is_open: false } });
  });
  it("luar-jam: sekarang (WIB) di luar open/close", async () => {
    set("luar-jam");
    const result = await getProfile();
    if (!("data" in result)) throw new Error("harus data");
    const wib = new Date(Date.now() + 7 * 3600e3);
    const now = wib.getUTCHours() * 60 + wib.getUTCMinutes();
    const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
    expect(now < toMinutes(result.data.open_time) || now > toMinutes(result.data.close_time)).toBe(true);
  });
  it("getProfile membaca /profile dari backend apa adanya", async () => {
    set();
    const serverProfile = { ...profile(), business_name: "Dari Server" };
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: serverProfile });
    expect(await getProfile()).toEqual({ data: serverProfile });
    expect(merchantFetch).toHaveBeenCalledWith("/profile");
  });
  it("getProfile: backend 500 -> { error } pesan backend", async () => {
    set();
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: "INTERNAL_ERROR", message: "Dari server" },
    });
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
    const result = await getOrders({ status: "ready", date: "2026-11-01", q: "rina", page: 2 });
    expect(merchantFetch).toHaveBeenCalledWith("/orders?status=ready&date=2026-11-01&q=rina&page=2&limit=20");
    expect(result).toEqual({ data: { rows, total: 41 } });
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: "INTERNAL_ERROR", message: "Dari server" },
    });
    expect(await getOrders()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
  });
  it("getQueue: aktif + hari ini, kode sama sekali; galat salah satu -> error", async () => {
    set();
    const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    const allOrders = orders();
    merchantFetch.mockImplementation(async (path: string) => ({
      ok: true,
      status: 200,
      data: path.includes("date=") ? [allOrders[0], allOrders[1]] : [allOrders[1], allOrders[2]],
    }));
    const result = await getQueue();
    expect(merchantFetch).toHaveBeenCalledWith("/orders?status=holding,confirmed,cooking,ready&limit=100");
    expect(merchantFetch).toHaveBeenCalledWith(`/orders?date=${today}&limit=100`);
    expect("data" in result && result.data.map((order) => order.code).sort()).toEqual(
      [allOrders[0].code, allOrders[1].code, allOrders[2].code].sort(),
    );
    merchantFetch.mockImplementation(async (path: string) =>
      path.includes("date=")
        ? { ok: false, status: 500, error: { code: "X", message: "x" } }
        : { ok: true, status: 200, data: [] },
    );
    expect(await getQueue()).toEqual({ error: { code: "X", message: "x" } });
  });
  it("getQueue: pesanan-baru menumpuk satu pesanan holding dibuat sekarang", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: [] });
    set("pesanan-baru");
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: [] });
    const result = await getQueue();
    if (!("data" in result)) throw new Error("data");
    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe("holding");
    expect(Math.abs(Date.now() - Date.parse(result.data[0].created_at))).toBeLessThan(5000);
  });
  it("getNeedsActionCount: meta.total dari holding,confirmed; galat -> 0", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: [], meta: { page: 1, limit: 1, total: 7 } });
    expect(await getNeedsActionCount()).toBe(7);
    expect(merchantFetch).toHaveBeenCalledWith("/orders?status=holding,confirmed&limit=1");
    merchantFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "X", message: "x" } });
    expect(await getNeedsActionCount()).toBe(0);
  });
  it("getOrder: GET /orders/:code, NOT_FOUND dan gagal-muat", async () => {
    set();
    expect(await getOrder("KK-20261031-7QF2")).toMatchObject({ data: { code: "KK-20261031-7QF2" } });
    expect(merchantFetch).toHaveBeenCalledWith("/orders/KK-20261031-7QF2");
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 404,
      error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan." },
    });
    expect(await getOrder("KK/ANEH")).toMatchObject({ error: { code: "NOT_FOUND" } });
    expect(merchantFetch).toHaveBeenLastCalledWith("/orders/KK%2FANEH");
  });
});

describe("getChangedOrders", () => {
  const SINCE = "2026-11-01T03:00:00.000Z";
  const makeRows = (count: number, updatedAt: string, codePrefix = "K") =>
    Array.from({ length: count }, (_, i) => ({
      ...orders()[0],
      code: `${codePrefix}${i}`,
      updated_at: i === count - 1 ? updatedAt : SINCE,
    }));
  const ordersPath = (since: string) => `/orders?${new URLSearchParams({ updated_since: since, limit: "100" })}`;

  it("memanggil /orders?updated_since&limit=100; < 100 baris -> satu panggilan", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: makeRows(2, "2026-11-01T03:01:00.000Z") });
    expect(await getChangedOrders(SINCE)).toMatchObject({ data: [{ code: "K0" }, { code: "K1" }] });
    expect(merchantFetch).toHaveBeenCalledWith("/orders?updated_since=2026-11-01T03%3A00%3A00.000Z&limit=100");
    expect(merchantFetch).toHaveBeenCalledTimes(1);
  });
  it("100 baris -> maju dengan updated_at terbesar; kode sama muncul sekali (versi terakhir)", async () => {
    set();
    const LATER = "2026-11-01T03:05:00.000Z";
    merchantFetch.mockResolvedValueOnce({ ok: true, status: 200, data: makeRows(100, LATER) }).mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: [{ ...orders()[0], code: "K0", updated_at: LATER, status: "confirmed" }],
    });
    const result = await getChangedOrders(SINCE);
    expect(merchantFetch).toHaveBeenNthCalledWith(2, ordersPath(LATER));
    if (!("data" in result)) throw new Error("galat");
    expect(result.data).toHaveLength(100);
    expect(result.data.filter((order) => order.code === "K0")).toEqual([
      expect.objectContaining({ status: "confirmed" }),
    ]);
  });
  it("100 baris dengan terbesar = sejak -> berhenti", async () => {
    set();
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: makeRows(100, SINCE) });
    await getChangedOrders(SINCE);
    expect(merchantFetch).toHaveBeenCalledTimes(1);
  });
  it("selalu 100 baris naik -> tepat 5 panggilan", async () => {
    set();
    let callCount = 0;
    merchantFetch.mockImplementation(async () => ({
      ok: true,
      status: 200,
      data: makeRows(100, new Date(Date.parse(SINCE) + ++callCount * 1000).toISOString(), `P${callCount}-`),
    }));
    await getChangedOrders(SINCE);
    expect(merchantFetch).toHaveBeenCalledTimes(5);
  });
  it("galat backend -> { error }", async () => {
    set();
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: "INTERNAL_ERROR", message: "Dari server" },
    });
    expect(await getChangedOrders(SINCE)).toEqual({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
  });
  it("skenario: kosong -> [] tanpa fetch; gagal-sinkron & gagal-muat -> error", async () => {
    set("kosong");
    merchantFetch.mockClear();
    expect(await getChangedOrders(SINCE)).toEqual({ data: [] });
    expect(merchantFetch).not.toHaveBeenCalled();
    for (const scenario of ["gagal-sinkron", "gagal-muat"]) {
      set(scenario);
      expect(await getChangedOrders(SINCE)).toEqual(ERR);
    }
  });
});

describe("laporan memakai API", () => {
  const RANGE = { from: "2026-10-25", to: "2026-10-31" };
  const summary = {
    target: 3_500_000,
    revenue: 2_270_000,
    hpp_total: 1_453_500,
    profit: 816_500,
    achievement_pct: 65,
    orders: 21,
  };
  it("getReportSummary / getHourly / getTransactions: path + query, data apa adanya", async () => {
    set();
    const jam = [{ hour: 11, orders: 2, portions: 4, revenue: 30000 }];
    const transactionRows = [
      {
        code: "KK-20261031-AB2C",
        created_at: "2026-10-31T04:00:00.000Z",
        completed_at: "2026-10-31T04:42:00.000Z",
        customer_name: "Rafli",
        payment_method: "cod",
        menu_name: "Nasi Ayam",
        qty: 2,
        total: 44000,
        hpp_total: 28000,
        status: "completed",
      },
    ];
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: summary });
    expect(await getReportSummary(RANGE)).toEqual({ data: summary });
    expect(merchantFetch).toHaveBeenLastCalledWith("/reports/summary?from=2026-10-25&to=2026-10-31");
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: jam });
    expect(await getHourly({ date: RANGE.to })).toEqual({ data: jam });
    expect(merchantFetch).toHaveBeenLastCalledWith("/reports/hourly?date=2026-10-31");
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: transactionRows });
    expect(await getTransactions(RANGE)).toEqual({ data: transactionRows });
    expect(merchantFetch).toHaveBeenLastCalledWith("/reports/transactions?from=2026-10-25&to=2026-10-31");
  });
  it("galat API diteruskan sebagai { error }", async () => {
    set();
    const error = { code: "VALIDATION_ERROR", message: "Data tidak valid." };
    merchantFetch.mockResolvedValue({ ok: false, status: 400, error });
    for (const load of [
      () => getReportSummary(RANGE),
      () => getHourly({ date: RANGE.to }),
      () => getTransactions(RANGE),
    ])
      expect(await load()).toEqual({ error });
  });
  it("gagal-muat -> error tanpa memanggil API", async () => {
    set("gagal-muat");
    merchantFetch.mockClear();
    for (const load of [
      () => getReportSummary(RANGE),
      () => getHourly({ date: RANGE.to }),
      () => getTransactions(RANGE),
    ])
      expect(await load()).toEqual(ERR);
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it.each(["kosong", "penjual-baru"])("%s -> nol dan [] tanpa memanggil API", async (scenario) => {
    set(scenario);
    merchantFetch.mockClear();
    expect(await getReportSummary(RANGE)).toEqual({
      data: { target: 0, revenue: 0, hpp_total: 0, profit: 0, achievement_pct: 0, orders: 0 },
    });
    expect(await getTransactions(RANGE)).toEqual({ data: [] });
    expect(await getHourly({ date: RANGE.to })).toEqual({ data: [] });
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});

describe("data contoh dashboard dihapus", () => {
  it("tidak ada getDashboard / DashboardSummary / omzetHariIni di fe", async () => {
    const { existsSync, readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = join(__dirname, "..");
    const matches: string[] = [];
    let scannedCount = 0;
    const walk = (folder: string) => {
      for (const entry of readdirSync(folder)) {
        if (["node_modules", ".next", "docs"].includes(entry)) continue;
        const fullPath = join(folder, entry);
        if (statSync(fullPath).isDirectory()) walk(fullPath);
        else if (/\.(ts|tsx)$/.test(entry) && !fullPath.endsWith("services.test.ts")) {
          scannedCount++;
          if (/getDashboard|DashboardSummary|omzetHariIni/.test(readFileSync(fullPath, "utf8"))) matches.push(fullPath);
        }
      }
    };
    for (const folder of ["app", "components", "lib", "services", "hooks"])
      if (existsSync(join(root, folder))) walk(join(root, folder));
    expect(scannedCount).toBeGreaterThan(0);
    expect(matches).toEqual([]);
  });
});
