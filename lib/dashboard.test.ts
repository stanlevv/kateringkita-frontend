// Test logika dashboard penjual: aksi optimistis, antrean per tab, stok, penggabungan polling, dan KPI hari ini.
import { describe, expect, it } from "vitest";
import { menus } from "./fixtures/menus";
import { orders } from "./fixtures/orders";
import {
  queueForTab,
  updatedSinceCursor,
  setOrDeleteKey,
  countQueueTabs,
  summarizeToday,
  mergeOrders,
  clockOffsetMs,
  holdSecondsLeft,
  menuStockLevel,
  pruneOptimisticActions,
  applyOptimisticActions,
  applyHoldExpiry,
  sortMenusByStock,
} from "./dashboard";
import { countNeedsAction } from "./shell";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";

const makeOrder = (overrides: Partial<MerchantOrder>): MerchantOrder => ({ ...orders()[0], ...overrides });

describe("D14 terapkanOptimis: status tujuan hanya selama updated_at server sama", () => {
  const base = makeOrder({
    code: "A",
    status: "holding",
    payment_method: "cod",
    updated_at: "2026-11-01T10:00:00.000Z",
  });
  it("updated_at sama dengan dasar -> status tujuan, updated_at tetap milik server", () => {
    const [result] = applyOptimisticActions([base], { A: { action: "confirm", baseUpdatedAt: base.updated_at } });
    expect(result.status).toBe("confirmed");
    expect(result.updated_at).toBe(base.updated_at);
  });
  it("updated_at server berubah -> objek server apa adanya (entri gugur)", () => {
    const updated = { ...base, status: "confirmed" as const, updated_at: "2026-11-01T10:00:05.000Z" };
    expect(applyOptimisticActions([updated], { A: { action: "confirm", baseUpdatedAt: base.updated_at } })).toEqual([
      updated,
    ]);
  });
  it("pangkasOptimis membuang entri yang dasarnya tak cocok; objek sama bila tak ada yang dibuang", () => {
    const actions = {
      A: { action: "confirm" as const, baseUpdatedAt: base.updated_at },
      B: { action: "cook" as const, baseUpdatedAt: "lain" },
    };
    expect(pruneOptimisticActions([base], actions)).toEqual({ A: actions.A });
    const unchanged = { A: actions.A };
    expect(pruneOptimisticActions([base], unchanged)).toBe(unchanged);
  });
  it("aksi tak sah untuk status itu / kode lain -> objek server", () => {
    expect(applyOptimisticActions([base], { A: { action: "ready", baseUpdatedAt: base.updated_at } })).toEqual([base]);
    expect(applyOptimisticActions([base], { B: { action: "confirm", baseUpdatedAt: base.updated_at } })).toEqual([
      base,
    ]);
  });
});

const iso = (timestamp: number) => new Date(timestamp).toISOString();
const OLD_CREATED_AT = iso(-600_000); // dibuat jauh sebelum `sekarang` di test -> bukan pesanan baru

describe("DB-A4 waktu tahan", () => {
  it("sisa = hold_until − sekarang, minimal 0", () => {
    const order = makeOrder({ status: "holding", hold_until: iso(1_100_000) });
    expect(holdSecondsLeft(order, 1_030_000)).toBe(70);
    expect(holdSecondsLeft(order, 1_200_000)).toBe(0);
    expect(holdSecondsLeft(makeOrder({ status: "confirmed", hold_until: null }), 0)).toBeNull();
  });
  it("habis -> Kadaluarsa, tetap di Perlu tindakan 3 dtk lalu keluar (tetap di Semua)", () => {
    const list = [
      makeOrder({ code: "A", status: "holding", hold_until: iso(10_000), created_at: OLD_CREATED_AT }),
      makeOrder({ code: "B", status: "holding", hold_until: iso(100_000), created_at: OLD_CREATED_AT }),
    ];
    const expiredFirst = applyHoldExpiry(list, 11_000);
    expect(expiredFirst.map((order) => order.status)).toEqual(["expired", "holding"]);
    expect(queueForTab(expiredFirst, "tindakan", 11_000).map((order) => order.code)).toEqual(["A", "B"]);
    const expiredBoth = applyHoldExpiry(list, 13_000);
    expect(queueForTab(expiredBoth, "tindakan", 13_000).map((order) => order.code)).toEqual(["B"]);
    expect(queueForTab(expiredBoth, "semua", 13_000).map((order) => order.code)).toContain("A");
  });
});

describe("ganti", () => {
  it("ganti: set dan hapus kunci tanpa mengubah objek lama", () => {
    const original = { x: 1 };
    expect(setOrDeleteKey(original, "y", 2)).toEqual({ x: 1, y: 2 });
    expect(setOrDeleteKey(original, "x", undefined)).toEqual({});
    expect(original).toEqual({ x: 1 });
  });
});

describe("tab antrean (brief §3)", () => {
  const list = orders();
  const later = Date.now() + 120_000; // tidak ada pesanan "baru"
  it("Perlu tindakan = holding + confirmed; holding paling cepat habis dulu", () => {
    const queue = queueForTab(list, "tindakan", later);
    expect(queue.every((order) => order.status === "holding" || order.status === "confirmed")).toBe(true);
    const holding = queue.filter((order) => order.status === "holding");
    expect(queue.slice(0, holding.length)).toEqual(holding);
    const holdUntil = holding.map((order) => Date.parse(order.hold_until!));
    expect(holdUntil).toEqual([...holdUntil].sort((first, second) => first - second));
  });
  it("jumlah tab Perlu tindakan sama dengan perluTindakan() (KPI & sidebar)", () => {
    const j = countQueueTabs(list);
    expect(j.tindakan).toBe(countNeedsAction(list));
    // Daftar tetap memuat holding VA (virtual account)/online yang menunggu pembayaran; angka hanya yang perlu tindakan penjual
    expect(j.tindakan).toBe(
      queueForTab(list, "tindakan", later).filter((order) => countNeedsAction([order]) === 1).length,
    );
    expect(j.dimasak).toBe(list.filter((order) => order.status === "cooking").length);
    expect(j.siap).toBe(list.filter((order) => order.status === "ready").length);
    expect(j.semua).toBe(list.length);
  });
  it("Semua hari ini: terbaru dulu", () => {
    const createdTimes = queueForTab(list, "semua", later).map((order) => Date.parse(order.created_at));
    expect(createdTimes).toEqual([...createdTimes].sort((first, second) => second - first));
  });
  it("brief §6: pesanan baru (< 60 dtk, belum ditindak) di atas Perlu tindakan", () => {
    const queueOrders = [
      makeOrder({ code: "LAMA", status: "holding", created_at: iso(0), hold_until: iso(100_000) }),
      makeOrder({ code: "BARU", status: "holding", created_at: iso(70_000), hold_until: iso(370_000) }),
      makeOrder({ code: "OK", status: "confirmed", created_at: iso(75_000), confirmed_at: iso(76_000) }),
    ];
    expect(queueForTab(queueOrders, "tindakan", 80_000).map((order) => order.code)).toEqual(["BARU", "LAMA", "OK"]);
    expect(queueForTab(queueOrders, "tindakan", 140_000).map((order) => order.code)).toEqual(["LAMA", "BARU", "OK"]);
  });
});

describe("DB-N3 panel kuota", () => {
  const makeMenu = (id: number, available: number, is_active = true) =>
    ({ ...menus()[0], id, available, is_active }) as MerchantMenu;
  it("stok: habis 0, menipis <= 3, aman > 3", () => {
    expect([0, 1, 3, 4].map((available) => menuStockLevel(makeMenu(1, available)))).toEqual([
      "habis",
      "menipis",
      "menipis",
      "aman",
    ]);
  });
  it("urut Habis -> Menipis -> Aman, menu nonaktif tidak tampil", () => {
    const result = sortMenusByStock([
      makeMenu(1, 10),
      makeMenu(2, 2),
      makeMenu(3, 0),
      makeMenu(4, 5, false),
      makeMenu(5, 3),
    ]);
    expect(result.map((menu) => menu.id)).toEqual([3, 2, 5, 1]);
  });
});

describe("D5 satukanPesanan", () => {
  const orderA = makeOrder({ code: "A", updated_at: "2026-11-01T04:00:10.000Z", status: "holding" });
  const orderB = makeOrder({ code: "B", updated_at: "2026-11-01T04:00:20.000Z", status: "confirmed" });
  const current = [orderA, orderB];
  it("kode baru ditambahkan", () => {
    const orderC = makeOrder({ code: "C", updated_at: "2026-11-01T04:00:30.000Z" });
    expect(mergeOrders(current, [orderC]).map((order) => order.code)).toEqual(["A", "B", "C"]);
  });
  it("updated_at lebih baru -> diganti; lebih lama -> lama tetap; sama tetapi status beda -> diganti", () => {
    const newer = { ...orderA, status: "confirmed" as const, updated_at: "2026-11-01T04:00:11.000Z" };
    const stale = { ...orderB, status: "holding" as const, updated_at: "2026-11-01T04:00:19.000Z" };
    const result = mergeOrders(current, [newer, stale]);
    expect(result[0]).toBe(newer);
    expect(result[1]).toBe(orderB);
    const sameTime = { ...orderB, status: "cooking" as const };
    expect(mergeOrders(current, [sameTime])[1]).toBe(sameTime);
  });
  it("tidak ada perubahan -> referensi sama", () => {
    expect(mergeOrders(current, [])).toBe(current);
    expect(mergeOrders(current, [{ ...orderA, updated_at: "2026-11-01T04:00:00.000Z" }])).toBe(current);
    expect(mergeOrders(current, [{ ...orderA }, { ...orderB }])).toBe(current); // respons identik (updated_at & status sama)
  });
});

describe("D3 batasSejak", () => {
  it("updated_at terbesar - 5 dtk", () => {
    const list = [
      makeOrder({ code: "A", updated_at: "2026-11-01T04:00:10Z" }),
      makeOrder({ code: "B", updated_at: "2026-11-01T04:00:20Z" }),
    ];
    expect(updatedSinceCursor(list, 0)).toBe("2026-11-01T04:00:15.000Z");
  });
  it("kosong -> cadangan - 60 dtk", () => {
    expect(updatedSinceCursor([], Date.parse("2026-11-01T04:01:00Z"))).toBe("2026-11-01T04:00:00.000Z");
  });
});

describe("D8 selisihJam", () => {
  it("hold_until - seconds_left - diterima dari holding pertama", () => {
    const list = [
      makeOrder({ code: "X", status: "confirmed", hold_until: null, seconds_left: null }),
      makeOrder({ code: "A", status: "holding", hold_until: "2026-11-01T04:05:00Z", seconds_left: 300 }),
    ];
    expect(clockOffsetMs(list, Date.parse("2026-11-01T03:59:58Z"))).toBe(2000);
  });
  it("holding dengan seconds_left 0 diabaikan (sudah habis, tak bisa menakar jam)", () => {
    const expired = makeOrder({ code: "Z", status: "holding", hold_until: "2026-11-01T04:00:00Z", seconds_left: 0 });
    const active = makeOrder({ code: "A", status: "holding", hold_until: "2026-11-01T04:05:00Z", seconds_left: 300 });
    expect(clockOffsetMs([expired, active], Date.parse("2026-11-01T03:59:58Z"))).toBe(2000);
    expect(clockOffsetMs([expired], 0)).toBeNull();
  });
  it("tanpa holding -> null", () => {
    expect(clockOffsetMs([makeOrder({ status: "confirmed", hold_until: null, seconds_left: null })], 0)).toBeNull();
  });
});

describe("D2 ringkasHariIni", () => {
  const NOW = Date.parse("2026-11-01T03:00:00Z"); // 1 Nov 2026 10:00 WIB
  const item = (menu_id: number, menu_name: string, qty: number) => ({
    menu_id,
    menu_name,
    qty,
    unit_price: 10000,
    options: [],
    line_total: qty * 10000,
  });
  const today = "2026-11-01T01:00:00Z";
  const list = [
    makeOrder({
      code: "S1",
      status: "completed",
      subtotal: 28000,
      total: 30000,
      created_at: today,
      confirmed_at: "2026-11-01T01:00:00Z",
      ready_at: "2026-11-01T01:12:00Z",
      completed_at: "2026-11-01T01:20:00Z",
      items: [item(1, "Nasi Ayam", 2)],
    }),
    makeOrder({
      code: "S2",
      status: "completed",
      subtotal: 48000,
      total: 50000,
      created_at: "2026-10-31T16:00:00Z",
      confirmed_at: "2026-10-31T16:10:00Z",
      ready_at: "2026-10-31T16:20:00Z",
      completed_at: "2026-10-31T16:30:00Z",
      items: [item(2, "Soto", 9)],
    }),
    makeOrder({
      code: "R1",
      status: "ready",
      subtotal: 18000,
      total: 20000,
      created_at: today,
      confirmed_at: "2026-11-01T02:00:00Z",
      ready_at: "2026-11-01T02:18:00Z",
      completed_at: null,
      items: [item(1, "Nasi Ayam", 1), item(3, "Es Teh", 2)],
    }),
    makeOrder({
      code: "H1",
      status: "holding",
      total: 10000,
      created_at: today,
      confirmed_at: null,
      ready_at: null,
      completed_at: null,
      items: [item(3, "Es Teh", 5)],
    }),
    makeOrder({
      code: "C1",
      status: "cancelled",
      total: 10000,
      created_at: today,
      confirmed_at: null,
      ready_at: null,
      completed_at: null,
      items: [item(3, "Es Teh", 5)],
    }),
    makeOrder({
      code: "K1",
      status: "confirmed",
      total: 10000,
      created_at: today,
      confirmed_at: today,
      ready_at: null,
      completed_at: null,
      items: [item(3, "Es Teh", 1)],
    }),
  ];
  const makeMenu = (id: number, quota_today: number, sold_today: number, held_today: number, is_active = true) =>
    ({ ...menus()[0], id, quota_today, sold_today, held_today, is_active }) as MerchantMenu;
  const menuList = [makeMenu(1, 20, 5, 2), makeMenu(2, 10, 3, 0), makeMenu(3, 50, 40, 0, false)];

  it("D10 omzet = jumlah subtotal (bukan total) pesanan completed hari ini", () => {
    expect(summarizeToday(list, menuList, NOW).revenue).toBe(28000);
  });
  it("omzet hanya completed hari ini (WIB); kapasitas menu aktif; perlu tindakan", () => {
    const summary = summarizeToday(list, menuList, NOW);
    expect(summary.revenue).toBe(28000);
    expect(summary.capacity).toEqual({ used: 10, total: 30 });
    expect(summary.needsAction).toBe(2);
  });
  it("rata-rata siap 12 & 18 menit -> 15; tanpa ready_at -> null", () => {
    expect(summarizeToday(list, menuList, NOW).averageReadyMinutes).toBe(15);
    expect(
      summarizeToday(
        list.filter((order) => !order.ready_at || order.code === "S2"),
        menuList,
        NOW,
      ).averageReadyMinutes,
    ).toBeNull();
  });
  it("terlaris menjumlah qty lintas pesanan, abaikan holding/cancelled; kosong -> null", () => {
    expect(summarizeToday(list, menuList, NOW).bestSeller).toEqual({ name: "Nasi Ayam", portions: 3 });
    expect(summarizeToday([], menuList, NOW).bestSeller).toBeNull();
  });
  it("ready -> completed menaikkan omzet sebesar subtotal", () => {
    const before = summarizeToday(list, menuList, NOW).revenue;
    const after = list.map((order) =>
      order.code === "R1" ? { ...order, status: "completed" as const, completed_at: "2026-11-01T02:30:00Z" } : order,
    );
    expect(summarizeToday(after, menuList, NOW).revenue).toBe(before + 18000);
  });
});
