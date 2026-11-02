import { describe, expect, it } from "vitest";
import { menus } from "./fixtures/menus";
import { orders } from "./fixtures/orders";
import { antrean, batasSejak, ganti, jumlahTab, ringkasHariIni, satukanPesanan, selisihJam, sisaHold, stokMenu, pangkasOptimis, terapkanOptimis, terapkanWaktu, urutKuota } from "./dashboard";
import { perluTindakan } from "./shell";
import type { MerchantMenu, MerchantOrder } from "./types";

const o = (p: Partial<MerchantOrder>): MerchantOrder => ({ ...orders()[0], ...p });

describe("D14 terapkanOptimis: status tujuan hanya selama updated_at server sama", () => {
  const dasar = o({ code: "A", status: "holding", payment_method: "cod", updated_at: "2026-11-01T10:00:00.000Z" });
  it("updated_at sama dengan dasar -> status tujuan, updated_at tetap milik server", () => {
    const [x] = terapkanOptimis([dasar], { A: { aksi: "confirm", dasar: dasar.updated_at } });
    expect(x.status).toBe("confirmed");
    expect(x.updated_at).toBe(dasar.updated_at);
  });
  it("updated_at server berubah -> objek server apa adanya (entri gugur)", () => {
    const baru = { ...dasar, status: "confirmed" as const, updated_at: "2026-11-01T10:00:05.000Z" };
    expect(terapkanOptimis([baru], { A: { aksi: "confirm", dasar: dasar.updated_at } })).toEqual([baru]);
  });
  it("pangkasOptimis membuang entri yang dasarnya tak cocok; objek sama bila tak ada yang dibuang", () => {
    const e = { A: { aksi: "confirm" as const, dasar: dasar.updated_at }, B: { aksi: "cook" as const, dasar: "lain" } };
    expect(pangkasOptimis([dasar], e)).toEqual({ A: e.A });
    const utuh = { A: e.A };
    expect(pangkasOptimis([dasar], utuh)).toBe(utuh);
  });
  it("aksi tak sah untuk status itu / kode lain -> objek server", () => {
    expect(terapkanOptimis([dasar], { A: { aksi: "ready", dasar: dasar.updated_at } })).toEqual([dasar]);
    expect(terapkanOptimis([dasar], { B: { aksi: "confirm", dasar: dasar.updated_at } })).toEqual([dasar]);
  });
});

const iso = (ms: number) => new Date(ms).toISOString();
const LAMA = iso(-600_000); // dibuat jauh sebelum `sekarang` di test -> bukan pesanan baru

describe("DB-A4 waktu tahan", () => {
  it("sisa = hold_until − sekarang, minimal 0", () => {
    const x = o({ status: "holding", hold_until: iso(1_100_000) });
    expect(sisaHold(x, 1_030_000)).toBe(70);
    expect(sisaHold(x, 1_200_000)).toBe(0);
    expect(sisaHold(o({ status: "confirmed", hold_until: null }), 0)).toBeNull();
  });
  it("habis -> Kadaluarsa, tetap di Perlu tindakan 3 dtk lalu keluar (tetap di Semua)", () => {
    const list = [o({ code: "A", status: "holding", hold_until: iso(10_000), created_at: LAMA }), o({ code: "B", status: "holding", hold_until: iso(100_000), created_at: LAMA })];
    const t1 = terapkanWaktu(list, 11_000);
    expect(t1.map((x) => x.status)).toEqual(["expired", "holding"]);
    expect(antrean(t1, "tindakan", 11_000).map((x) => x.code)).toEqual(["A", "B"]);
    const t2 = terapkanWaktu(list, 13_000);
    expect(antrean(t2, "tindakan", 13_000).map((x) => x.code)).toEqual(["B"]);
    expect(antrean(t2, "semua", 13_000).map((x) => x.code)).toContain("A");
  });
});

describe("ganti", () => {
  it("ganti: set dan hapus kunci tanpa mengubah objek lama", () => {
    const a = { x: 1 };
    expect(ganti(a, "y", 2)).toEqual({ x: 1, y: 2 });
    expect(ganti(a, "x", undefined)).toEqual({});
    expect(a).toEqual({ x: 1 });
  });
});

describe("tab antrean (brief §3)", () => {
  const list = orders();
  const nanti = Date.now() + 120_000; // tidak ada pesanan "baru"
  it("Perlu tindakan = holding + confirmed; holding paling cepat habis dulu", () => {
    const t = antrean(list, "tindakan", nanti);
    expect(t.every((x) => x.status === "holding" || x.status === "confirmed")).toBe(true);
    const holding = t.filter((x) => x.status === "holding");
    expect(t.slice(0, holding.length)).toEqual(holding);
    const batas = holding.map((x) => Date.parse(x.hold_until!));
    expect(batas).toEqual([...batas].sort((a, b) => a - b));
  });
  it("jumlah tab Perlu tindakan sama dengan perluTindakan() (KPI & sidebar)", () => {
    const j = jumlahTab(list);
    expect(j.tindakan).toBe(perluTindakan(list));
    expect(j.tindakan).toBe(antrean(list, "tindakan", nanti).length);
    expect(j.dimasak).toBe(list.filter((x) => x.status === "cooking").length);
    expect(j.siap).toBe(list.filter((x) => x.status === "ready").length);
    expect(j.semua).toBe(list.length);
  });
  it("Semua hari ini: terbaru dulu", () => {
    const t = antrean(list, "semua", nanti).map((x) => Date.parse(x.created_at));
    expect(t).toEqual([...t].sort((a, b) => b - a));
  });
  it("brief §6: pesanan baru (< 60 dtk, belum ditindak) di atas Perlu tindakan", () => {
    const l = [
      o({ code: "LAMA", status: "holding", created_at: iso(0), hold_until: iso(100_000) }),
      o({ code: "BARU", status: "holding", created_at: iso(70_000), hold_until: iso(370_000) }),
      o({ code: "OK", status: "confirmed", created_at: iso(75_000), confirmed_at: iso(76_000) }),
    ];
    expect(antrean(l, "tindakan", 80_000).map((x) => x.code)).toEqual(["BARU", "LAMA", "OK"]);
    expect(antrean(l, "tindakan", 140_000).map((x) => x.code)).toEqual(["LAMA", "BARU", "OK"]);
  });
});

describe("DB-N3 panel kuota", () => {
  const m = (id: number, available: number, is_active = true) => ({ ...menus()[0], id, available, is_active }) as MerchantMenu;
  it("stok: habis 0, menipis <= 3, aman > 3", () => {
    expect([0, 1, 3, 4].map((a) => stokMenu(m(1, a)))).toEqual(["habis", "menipis", "menipis", "aman"]);
  });
  it("urut Habis -> Menipis -> Aman, menu nonaktif tidak tampil", () => {
    const hasil = urutKuota([m(1, 10), m(2, 2), m(3, 0), m(4, 5, false), m(5, 3)]);
    expect(hasil.map((x) => x.id)).toEqual([3, 2, 5, 1]);
  });
});

describe("D5 satukanPesanan", () => {
  const a = o({ code: "A", updated_at: "2026-11-01T04:00:10.000Z", status: "holding" });
  const b = o({ code: "B", updated_at: "2026-11-01T04:00:20.000Z", status: "confirmed" });
  const lama = [a, b];
  it("kode baru ditambahkan", () => {
    const c = o({ code: "C", updated_at: "2026-11-01T04:00:30.000Z" });
    expect(satukanPesanan(lama, [c]).map((x) => x.code)).toEqual(["A", "B", "C"]);
  });
  it("updated_at lebih baru -> diganti; lebih lama -> lama tetap; sama tetapi status beda -> diganti", () => {
    const baru = { ...a, status: "confirmed" as const, updated_at: "2026-11-01T04:00:11.000Z" };
    const usang = { ...b, status: "holding" as const, updated_at: "2026-11-01T04:00:19.000Z" };
    const hasil = satukanPesanan(lama, [baru, usang]);
    expect(hasil[0]).toBe(baru);
    expect(hasil[1]).toBe(b);
    const sama = { ...b, status: "cooking" as const };
    expect(satukanPesanan(lama, [sama])[1]).toBe(sama);
  });
  it("tidak ada perubahan -> referensi sama", () => {
    expect(satukanPesanan(lama, [])).toBe(lama);
    expect(satukanPesanan(lama, [{ ...a, updated_at: "2026-11-01T04:00:00.000Z" }])).toBe(lama);
    expect(satukanPesanan(lama, [{ ...a }, { ...b }])).toBe(lama); // respons identik (updated_at & status sama)
  });
});

describe("D3 batasSejak", () => {
  it("updated_at terbesar - 5 dtk", () => {
    const l = [o({ code: "A", updated_at: "2026-11-01T04:00:10Z" }), o({ code: "B", updated_at: "2026-11-01T04:00:20Z" })];
    expect(batasSejak(l, 0)).toBe("2026-11-01T04:00:15.000Z");
  });
  it("kosong -> cadangan - 60 dtk", () => {
    expect(batasSejak([], Date.parse("2026-11-01T04:01:00Z"))).toBe("2026-11-01T04:00:00.000Z");
  });
});

describe("D8 selisihJam", () => {
  it("hold_until - seconds_left - diterima dari holding pertama", () => {
    const l = [o({ code: "X", status: "confirmed", hold_until: null, seconds_left: null }), o({ code: "A", status: "holding", hold_until: "2026-11-01T04:05:00Z", seconds_left: 300 })];
    expect(selisihJam(l, Date.parse("2026-11-01T03:59:58Z"))).toBe(2000);
  });
  it("holding dengan seconds_left 0 diabaikan (sudah habis, tak bisa menakar jam)", () => {
    const habis = o({ code: "Z", status: "holding", hold_until: "2026-11-01T04:00:00Z", seconds_left: 0 });
    const aktif = o({ code: "A", status: "holding", hold_until: "2026-11-01T04:05:00Z", seconds_left: 300 });
    expect(selisihJam([habis, aktif], Date.parse("2026-11-01T03:59:58Z"))).toBe(2000);
    expect(selisihJam([habis], 0)).toBeNull();
  });
  it("tanpa holding -> null", () => {
    expect(selisihJam([o({ status: "confirmed", hold_until: null, seconds_left: null })], 0)).toBeNull();
  });
});

describe("D2 ringkasHariIni", () => {
  const SEKARANG = Date.parse("2026-11-01T03:00:00Z"); // 1 Nov 2026 10:00 WIB
  const item = (menu_id: number, menu_name: string, qty: number) => ({ menu_id, menu_name, qty, unit_price: 10000, options: [], line_total: qty * 10000 });
  const hariIni = "2026-11-01T01:00:00Z";
  const list = [
    o({ code: "S1", status: "completed", total: 30000, created_at: hariIni, confirmed_at: "2026-11-01T01:00:00Z", ready_at: "2026-11-01T01:12:00Z", completed_at: "2026-11-01T01:20:00Z", items: [item(1, "Nasi Ayam", 2)] }),
    o({ code: "S2", status: "completed", total: 50000, created_at: "2026-10-31T16:00:00Z", confirmed_at: "2026-10-31T16:10:00Z", ready_at: "2026-10-31T16:20:00Z", completed_at: "2026-10-31T16:30:00Z", items: [item(2, "Soto", 9)] }),
    o({ code: "R1", status: "ready", total: 20000, created_at: hariIni, confirmed_at: "2026-11-01T02:00:00Z", ready_at: "2026-11-01T02:18:00Z", completed_at: null, items: [item(1, "Nasi Ayam", 1), item(3, "Es Teh", 2)] }),
    o({ code: "H1", status: "holding", total: 10000, created_at: hariIni, confirmed_at: null, ready_at: null, completed_at: null, items: [item(3, "Es Teh", 5)] }),
    o({ code: "C1", status: "cancelled", total: 10000, created_at: hariIni, confirmed_at: null, ready_at: null, completed_at: null, items: [item(3, "Es Teh", 5)] }),
    o({ code: "K1", status: "confirmed", total: 10000, created_at: hariIni, confirmed_at: hariIni, ready_at: null, completed_at: null, items: [item(3, "Es Teh", 1)] }),
  ];
  const m = (id: number, quota_today: number, sold_today: number, held_today: number, is_active = true) => ({ ...menus()[0], id, quota_today, sold_today, held_today, is_active }) as MerchantMenu;
  const daftar = [m(1, 20, 5, 2), m(2, 10, 3, 0), m(3, 50, 40, 0, false)];

  it("omzet hanya completed hari ini (WIB); kapasitas menu aktif; perlu tindakan", () => {
    const r = ringkasHariIni(list, daftar, SEKARANG);
    expect(r.omzet).toBe(30000);
    expect(r.kapasitas).toEqual({ terpakai: 10, total: 30 });
    expect(r.perluTindakan).toBe(2);
  });
  it("rata-rata siap 12 & 18 menit -> 15; tanpa ready_at -> null", () => {
    expect(ringkasHariIni(list, daftar, SEKARANG).rataSiapMenit).toBe(15);
    expect(ringkasHariIni(list.filter((x) => !x.ready_at || x.code === "S2"), daftar, SEKARANG).rataSiapMenit).toBeNull();
  });
  it("terlaris menjumlah qty lintas pesanan, abaikan holding/cancelled; kosong -> null", () => {
    expect(ringkasHariIni(list, daftar, SEKARANG).terlaris).toEqual({ name: "Nasi Ayam", portions: 3 });
    expect(ringkasHariIni([], daftar, SEKARANG).terlaris).toBeNull();
  });
  it("ready -> completed menaikkan omzet sebesar total", () => {
    const sebelum = ringkasHariIni(list, daftar, SEKARANG).omzet;
    const sesudah = list.map((x) => (x.code === "R1" ? { ...x, status: "completed" as const, completed_at: "2026-11-01T02:30:00Z" } : x));
    expect(ringkasHariIni(sesudah, daftar, SEKARANG).omzet).toBe(sebelum + 20000);
  });
});
