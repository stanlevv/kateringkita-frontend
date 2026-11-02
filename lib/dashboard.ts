import { geserWib, tanggalWib } from "./format";
import { nextStatus, type AksiPesanan } from "./order-status";
import { perluTindakan } from "./shell";
import type { MerchantMenu, MerchantOrder } from "./types";

/** Salinan `rec` dengan `key` diganti, atau dihapus bila `v` undefined. */
export function ganti<V>(rec: Record<string, V>, key: string | number, v: V | undefined): Record<string, V> {
  const baru = { ...rec };
  if (v === undefined) delete baru[key];
  else baru[key] = v;
  return baru;
}

/** Aksi yang sedang tertunda/terkirim; `dasar` = `updated_at` server saat aksi dipilih (D14). */
export type Optimis = Record<string, { aksi: AksiPesanan; dasar: string }>;

/**
 * Tampilkan status tujuan selama `updated_at` server masih sama dengan `dasar`; begitu data baru datang
 * (refresh/polling) entri gugur sendiri dan objek server dipakai apa adanya. `updated_at` tetap milik server.
 */
export function terapkanOptimis(orders: MerchantOrder[], o: Optimis): MerchantOrder[] {
  return orders.map((x) => {
    const e = o[x.code];
    if (!e || e.dasar !== x.updated_at) return x;
    const next = nextStatus(x, e.aksi);
    return "error" in next ? x : { ...next, updated_at: x.updated_at };
  });
}

/** Buang entri yang `dasar`-nya tak cocok lagi dengan data server; objek sama bila tak ada yang dibuang. */
export function pangkasOptimis(orders: MerchantOrder[], o: Optimis): Optimis {
  const sisa = Object.entries(o).filter(([c, e]) => orders.some((x) => x.code === c && x.updated_at === e.dasar));
  return sisa.length === Object.keys(o).length ? o : Object.fromEntries(sisa);
}

/** Detik tahan tersisa dari `hold_until`. */
export function sisaHold(o: MerchantOrder, sekarang: number): number | null {
  if (o.status !== "holding" || !o.hold_until) return null;
  return Math.max(0, Math.ceil((Date.parse(o.hold_until) - sekarang) / 1000));
}

/** DB-A4: holding yang waktunya habis ditampilkan Kadaluarsa (server akan menyusul lewat polling). */
export function terapkanWaktu(orders: MerchantOrder[], sekarang: number): MerchantOrder[] {
  return orders.map((o) => (sisaHold(o, sekarang) === 0 ? { ...o, status: "expired" } : o));
}

export type TabAntrean = "tindakan" | "dimasak" | "siap" | "semua";

const ms = (iso: string | null) => (iso ? Date.parse(iso) : 0);
const naik = (k: (o: MerchantOrder) => number) => (a: MerchantOrder, b: MerchantOrder) => k(a) - k(b);
export const BARU_MS = 60_000;
const KADALUARSA_TAMPIL_MS = 3000;

export function antrean(orders: MerchantOrder[], tab: TabAntrean, sekarang: number): MerchantOrder[] {
  const by = (s: MerchantOrder["status"]) => orders.filter((o) => o.status === s);
  switch (tab) {
    case "tindakan": {
      // DB-A4: kadaluarsa barusan tetap terlihat 3 dtk. Brief §6: pesanan baru di atas, sisanya paling cepat habis dulu.
      const tahan = orders.filter((o) => o.status === "holding" || (o.status === "expired" && o.hold_until && sekarang - ms(o.hold_until) < KADALUARSA_TAMPIL_MS));
      const baru = tahan.filter((o) => o.status === "holding" && sekarang - ms(o.created_at) < BARU_MS).sort(naik((o) => -ms(o.created_at)));
      const lain = tahan.filter((o) => !baru.includes(o)).sort(naik((o) => ms(o.hold_until)));
      return [...baru, ...lain, ...by("confirmed").sort(naik((o) => ms(o.confirmed_at)))];
    }
    case "dimasak":
      return by("cooking").sort(naik((o) => ms(o.cooking_at)));
    case "siap":
      return by("ready").sort(naik((o) => ms(o.ready_at)));
    case "semua":
      return [...orders].sort(naik((o) => -ms(o.created_at)));
  }
}

export function jumlahTab(orders: MerchantOrder[]): Record<TabAntrean, number> {
  const n = (s: MerchantOrder["status"]) => orders.filter((o) => o.status === s).length;
  return { tindakan: perluTindakan(orders), dimasak: n("cooking"), siap: n("ready"), semua: orders.length };
}

export type Stok = "habis" | "menipis" | "aman";
export const stokMenu = (m: Pick<MerchantMenu, "available">): Stok => (m.available <= 0 ? "habis" : m.available <= 3 ? "menipis" : "aman");

const PERINGKAT: Record<Stok, number> = { habis: 0, menipis: 1, aman: 2 };
/** Brief §5: Habis -> Menipis (<= 3) -> Aman; hanya menu aktif. */
export const urutKuota = (menus: MerchantMenu[]) =>
  menus.filter((m) => m.is_active).sort((a, b) => PERINGKAT[stokMenu(a)] - PERINGKAT[stokMenu(b)]);

/**
 * D5: per `code`, baris masuk menang bila `updated_at` >= yang ada; baris dengan `updated_at` & status sama
 * dianggap tak berubah, sehingga respons identik mengembalikan referensi yang sama.
 */
export function satukanPesanan(lama: MerchantOrder[], masuk: MerchantOrder[]): MerchantOrder[] {
  const peta = new Map(lama.map((o) => [o.code, o]));
  let berubah = false;
  for (const o of masuk) {
    const ada = peta.get(o.code);
    if (ada && (Date.parse(o.updated_at) < Date.parse(ada.updated_at) || (o.updated_at === ada.updated_at && o.status === ada.status))) continue;
    peta.set(o.code, o);
    berubah = true;
  }
  return berubah ? [...peta.values()] : lama;
}

/** D3: `updated_at` terbesar - 5 dtk (tumpang tindih), atau `cadangan` - 60 dtk bila belum ada pesanan. */
export function batasSejak(orders: MerchantOrder[], cadangan: number): string {
  if (orders.length === 0) return new Date(cadangan - 60_000).toISOString();
  return new Date(Math.max(...orders.map((o) => Date.parse(o.updated_at))) - 5000).toISOString();
}

/** D8: selisih jam server - jam klien dari pesanan `holding` pertama yang masih berjalan; null bila tidak ada. */
export function selisihJam(orders: MerchantOrder[], diterima: number): number | null {
  const h = orders.find((o) => o.status === "holding" && o.hold_until && (o.seconds_left ?? 0) > 0);
  return h ? Date.parse(h.hold_until!) - h.seconds_left! * 1000 - diterima : null;
}

export type Ringkasan = {
  omzet: number;
  kapasitas: { terpakai: number; total: number };
  perluTindakan: number;
  rataSiapMenit: number | null;
  terlaris: { name: string; portions: number } | null;
};

const DIBAYAR_ALUR = new Set<MerchantOrder["status"]>(["confirmed", "cooking", "ready", "completed"]);

/** D2 (M-04): KPI dari antrean & kuota yang sama dengan kartu; "hari ini" = tanggal WIB dari `sekarang`. */
export function ringkasHariIni(orders: MerchantOrder[], menus: MerchantMenu[], sekarang: number): Ringkasan {
  const hari = geserWib(sekarang).toISOString().slice(0, 10);
  const hariIni = (iso: string | null) => !!iso && tanggalWib(iso) === hari;
  const omzet = orders.filter((o) => o.status === "completed" && hariIni(o.completed_at)).reduce((a, o) => a + o.total, 0);
  const aktif = menus.filter((m) => m.is_active);
  const kapasitas = { terpakai: aktif.reduce((a, m) => a + m.sold_today + m.held_today, 0), total: aktif.reduce((a, m) => a + m.quota_today, 0) };
  const siap = orders.filter((o) => hariIni(o.ready_at) && o.confirmed_at);
  const rataSiapMenit = siap.length ? Math.round(siap.reduce((a, o) => a + ms(o.ready_at) - ms(o.confirmed_at), 0) / siap.length / 60_000) : null;
  const porsi = new Map<number, { name: string; portions: number }>();
  for (const o of orders) {
    if (!DIBAYAR_ALUR.has(o.status) || !hariIni(o.created_at)) continue;
    for (const it of o.items) {
      const p = porsi.get(it.menu_id) ?? { name: it.menu_name, portions: 0 };
      porsi.set(it.menu_id, { ...p, portions: p.portions + it.qty });
    }
  }
  const terlaris = [...porsi.values()].reduce<Ringkasan["terlaris"]>((a, p) => (!a || p.portions > a.portions ? p : a), null);
  return { omzet, kapasitas, perluTindakan: perluTindakan(orders), rataSiapMenit, terlaris };
}
