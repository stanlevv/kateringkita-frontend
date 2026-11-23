// Logika murni (tanpa React) untuk dashboard penjual: antrean pesanan per tab, stok menu, penggabungan data
// hasil polling, dan angka KPI hari ini. Dipakai komponen app/(dashboard)/dashboard dan route /api/dashboard/sinkron.

import { toWibClock, wibDate } from "./format";
import { nextStatus, type OrderAction } from "./order-status";
import { countNeedsAction } from "./shell";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";

/**
 * Membuat salinan objek dengan satu kunci diganti, atau dihapus bila nilainya undefined. Objek asli tidak diubah.
 * @param record objek asal
 * @param key kunci yang diganti/dihapus
 * @param value nilai baru; undefined berarti kunci dihapus
 * @returns objek baru
 */
export function setOrDeleteKey<V>(
  record: Record<string, V>,
  key: string | number,
  value: V | undefined,
): Record<string, V> {
  const copy = { ...record };
  if (value === undefined) delete copy[key];
  else copy[key] = value;
  return copy;
}

/**
 * Aksi pesanan yang baru dipilih penjual dan sedang dikirim, per kode pesanan.
 * `baseUpdatedAt` = nilai `updated_at` dari server saat aksi dipilih, untuk tahu kapan data server sudah lebih baru.
 */
export type OptimisticActions = Record<string, { action: OrderAction; baseUpdatedAt: string }>;

/**
 * Menampilkan status tujuan lebih dulu (optimistic update), sebelum server menjawab.
 * Status tujuan hanya dipakai selama `updated_at` dari server masih sama dengan `baseUpdatedAt`.
 * Begitu data baru datang (refresh atau polling), data server dipakai apa adanya. `updated_at` tetap milik server.
 * @param orders pesanan dari server
 * @param actions aksi yang sedang berjalan
 * @returns daftar pesanan untuk ditampilkan
 */
export function applyOptimisticActions(orders: MerchantOrder[], actions: OptimisticActions): MerchantOrder[] {
  return orders.map((order) => {
    const action = actions[order.code];
    if (!action || action.baseUpdatedAt !== order.updated_at) return order;
    const next = nextStatus(order, action.action);
    return "error" in next ? order : { ...next, updated_at: order.updated_at };
  });
}

/**
 * Membuang aksi yang `baseUpdatedAt`-nya sudah tidak cocok dengan data server.
 * @param orders pesanan dari server
 * @param actions aksi yang sedang berjalan
 * @returns aksi yang masih berlaku; objek yang sama persis bila tidak ada yang dibuang (agar React tidak merender ulang)
 */
export function pruneOptimisticActions(orders: MerchantOrder[], actions: OptimisticActions): OptimisticActions {
  const kept = Object.entries(actions).filter(([code, action]) =>
    orders.some((order) => order.code === code && order.updated_at === action.baseUpdatedAt),
  );
  return kept.length === Object.keys(actions).length ? actions : Object.fromEntries(kept);
}

/**
 * Menghitung sisa detik sebelum pesanan "holding" kedaluwarsa (penjual harus mengonfirmasi sebelum habis).
 * @param order pesanan
 * @param now waktu sekarang dalam milidetik
 * @returns sisa detik (minimal 0), atau null bila pesanan tidak sedang ditahan
 */
export function holdSecondsLeft(order: MerchantOrder, now: number): number | null {
  if (order.status !== "holding" || !order.hold_until) return null;
  return Math.max(0, Math.ceil((Date.parse(order.hold_until) - now) / 1000));
}

/**
 * Menampilkan pesanan "holding" yang waktunya sudah habis sebagai "expired" tanpa menunggu server.
 * Server akan menyusul mengubah statusnya; perubahan itu masuk lewat polling.
 * @param orders pesanan
 * @param now waktu sekarang dalam milidetik
 */
export function applyHoldExpiry(orders: MerchantOrder[], now: number): MerchantOrder[] {
  return orders.map((order) => (holdSecondsLeft(order, now) === 0 ? { ...order, status: "expired" } : order));
}

/** Tab antrean di dashboard: perlu tindakan, dimasak, siap, dan semua. */
export type QueueTab = "tindakan" | "dimasak" | "siap" | "semua";

const toTimestamp = (iso: string | null) => (iso ? Date.parse(iso) : 0);
const ascendingBy = (getValue: (order: MerchantOrder) => number) => (first: MerchantOrder, second: MerchantOrder) =>
  getValue(first) - getValue(second);
/** Pesanan yang dibuat kurang dari 60 detik lalu dianggap "baru" dan ditaruh paling atas. */
export const NEW_ORDER_MS = 60_000;
const EXPIRED_VISIBLE_MS = 3000;

/**
 * Mengambil dan mengurutkan pesanan untuk satu tab antrean.
 * Tab "tindakan": pesanan baru paling atas, lalu yang waktu tahannya paling cepat habis, lalu yang sudah dikonfirmasi.
 * @param orders semua pesanan antrean
 * @param tab tab yang dibuka
 * @param now waktu sekarang dalam milidetik
 * @returns pesanan untuk tab itu, sudah urut
 */
export function queueForTab(orders: MerchantOrder[], tab: QueueTab, now: number): MerchantOrder[] {
  const ofStatus = (status: MerchantOrder["status"]) => orders.filter((order) => order.status === status);
  switch (tab) {
    case "tindakan": {
      // 1. Ambil pesanan yang ditahan; yang baru saja kedaluwarsa tetap terlihat 3 detik agar penjual sempat melihatnya.
      const holdingOrders = orders.filter(
        (order) =>
          order.status === "holding" ||
          (order.status === "expired" && order.hold_until && now - toTimestamp(order.hold_until) < EXPIRED_VISIBLE_MS),
      );
      // 2. Pesanan baru (kurang dari 60 detik) paling atas, yang terbaru dulu.
      const newOrders = holdingOrders
        .filter((order) => order.status === "holding" && now - toTimestamp(order.created_at) < NEW_ORDER_MS)
        .sort(ascendingBy((order) => -toTimestamp(order.created_at)));
      // 3. Sisanya diurutkan dari yang waktu tahannya paling cepat habis.
      const otherOrders = holdingOrders
        .filter((order) => !newOrders.includes(order))
        .sort(ascendingBy((order) => toTimestamp(order.hold_until)));
      // 4. Pesanan yang sudah dikonfirmasi menyusul di bawah.
      return [
        ...newOrders,
        ...otherOrders,
        ...ofStatus("confirmed").sort(ascendingBy((order) => toTimestamp(order.confirmed_at))),
      ];
    }
    case "dimasak":
      return ofStatus("cooking").sort(ascendingBy((order) => toTimestamp(order.cooking_at)));
    case "siap":
      return ofStatus("ready").sort(ascendingBy((order) => toTimestamp(order.ready_at)));
    case "semua":
      return [...orders].sort(ascendingBy((order) => -toTimestamp(order.created_at)));
  }
}

/**
 * Menghitung jumlah pesanan di tiap tab antrean (angka di samping nama tab).
 * @param orders semua pesanan antrean
 */
export function countQueueTabs(orders: MerchantOrder[]): Record<QueueTab, number> {
  const countStatus = (status: MerchantOrder["status"]) => orders.filter((order) => order.status === status).length;
  return {
    tindakan: countNeedsAction(orders),
    dimasak: countStatus("cooking"),
    siap: countStatus("ready"),
    semua: orders.length,
  };
}

/** Tingkat stok menu hari ini. */
export type StockLevel = "habis" | "menipis" | "aman";
/**
 * Menentukan tingkat stok: habis (0), menipis (1–3), atau aman (lebih dari 3).
 * @param menu menu (cukup `available`)
 */
export const menuStockLevel = (menu: Pick<MerchantMenu, "available">): StockLevel =>
  menu.available <= 0 ? "habis" : menu.available <= 3 ? "menipis" : "aman";

const STOCK_RANK: Record<StockLevel, number> = { habis: 0, menipis: 1, aman: 2 };
/**
 * Mengurutkan menu aktif untuk panel kuota: habis dulu, lalu menipis, lalu aman. Menu nonaktif tidak ikut.
 * @param menus semua menu penjual
 */
export const sortMenusByStock = (menus: MerchantMenu[]) =>
  menus
    .filter((menu) => menu.is_active)
    .sort((first, second) => STOCK_RANK[menuStockLevel(first)] - STOCK_RANK[menuStockLevel(second)]);

/**
 * Menggabungkan pesanan hasil polling ke daftar yang sudah ada, per kode pesanan.
 * Data masuk menang bila `updated_at`-nya sama atau lebih baru. Bila tidak ada yang berubah,
 * daftar lama dikembalikan apa adanya agar React tidak merender ulang.
 * @param current daftar yang sedang tampil
 * @param incoming pesanan yang berubah dari server
 * @returns daftar gabungan
 */
export function mergeOrders(current: MerchantOrder[], incoming: MerchantOrder[]): MerchantOrder[] {
  // 1. Petakan daftar lama per kode pesanan.
  const byCode = new Map(current.map((order) => [order.code, order]));
  let changed = false;
  // 2. Data masuk menggantikan data lama kecuali lebih tua, atau sama persis (waktu dan status sama).
  for (const order of incoming) {
    const existing = byCode.get(order.code);
    if (
      existing &&
      (Date.parse(order.updated_at) < Date.parse(existing.updated_at) ||
        (order.updated_at === existing.updated_at && order.status === existing.status))
    )
      continue;
    byCode.set(order.code, order);
    changed = true;
  }
  // 3. Tidak ada yang berubah -> kembalikan daftar lama (referensi sama).
  return changed ? [...byCode.values()] : current;
}

/**
 * Menentukan waktu `updated_since` untuk polling berikutnya: `updated_at` terbaru dikurangi 5 detik
 * (sengaja tumpang tindih agar tidak ada yang terlewat), atau `fallbackMs` dikurangi 60 detik bila belum ada pesanan.
 * @param orders pesanan yang sudah ada
 * @param fallbackMs waktu acuan bila daftar kosong (milidetik)
 * @returns waktu ISO
 */
export function updatedSinceCursor(orders: MerchantOrder[], fallbackMs: number): string {
  if (orders.length === 0) return new Date(fallbackMs - 60_000).toISOString();
  return new Date(Math.max(...orders.map((order) => Date.parse(order.updated_at))) - 5000).toISOString();
}

/**
 * Memperkirakan selisih jam server dengan jam di perangkat penjual, dari pesanan "holding" pertama yang masih berjalan.
 * Dipakai agar hitung mundur di kartu pesanan tetap tepat walau jam perangkat tidak akurat.
 * @param orders pesanan dari server
 * @param receivedAt waktu (jam perangkat) saat data diterima
 * @returns selisih dalam milidetik, atau null bila tidak ada pesanan yang bisa dipakai
 */
export function clockOffsetMs(orders: MerchantOrder[], receivedAt: number): number | null {
  const holdingOrder = orders.find(
    (order) => order.status === "holding" && order.hold_until && (order.seconds_left ?? 0) > 0,
  );
  return holdingOrder ? Date.parse(holdingOrder.hold_until!) - holdingOrder.seconds_left! * 1000 - receivedAt : null;
}

/** Angka KPI dashboard hari ini. */
export type TodaySummary = {
  revenue: number;
  capacity: { used: number; total: number };
  needsAction: number;
  averageReadyMinutes: number | null;
  bestSeller: { name: string; portions: number } | null;
};

const PAID_FLOW_STATUSES = new Set<MerchantOrder["status"]>(["confirmed", "cooking", "ready", "completed"]);

/**
 * Menghitung KPI hari ini dari antrean dan kuota yang sama dengan yang tampil di kartu.
 * "Hari ini" = tanggal WIB dari `now`. Omzet = jumlah subtotal pesanan selesai (sama dengan laporan, tanpa biaya layanan).
 * @param orders pesanan antrean
 * @param menus menu penjual
 * @param now waktu sekarang dalam milidetik
 * @returns omzet, kapasitas terpakai, jumlah perlu tindakan, rata-rata waktu siap, dan menu terlaris
 */
export function summarizeToday(orders: MerchantOrder[], menus: MerchantMenu[], now: number): TodaySummary {
  // 1. Tentukan tanggal hari ini (WIB) dan cara mengecek apakah suatu waktu jatuh hari ini.
  const todayDate = toWibClock(now).toISOString().slice(0, 10);
  const isToday = (iso: string | null) => !!iso && wibDate(iso) === todayDate;
  // 2. Omzet = subtotal pesanan yang selesai hari ini.
  const revenue = orders
    .filter((order) => order.status === "completed" && isToday(order.completed_at))
    .reduce((sum, order) => sum + order.subtotal, 0); // sama dengan omzet di laporan (tanpa biaya layanan)
  // 3. Kapasitas = porsi terjual + ditahan dibanding kuota, hanya menu aktif.
  const activeMenus = menus.filter((menu) => menu.is_active);
  const capacity = {
    used: activeMenus.reduce((sum, menu) => sum + menu.sold_today + menu.held_today, 0),
    total: activeMenus.reduce((sum, menu) => sum + menu.quota_today, 0),
  };
  // 4. Rata-rata menit dari dikonfirmasi sampai siap, untuk pesanan yang siap hari ini.
  const readyOrders = orders.filter((order) => isToday(order.ready_at) && order.confirmed_at);
  const averageReadyMinutes = readyOrders.length
    ? Math.round(
        readyOrders.reduce((sum, order) => sum + toTimestamp(order.ready_at) - toTimestamp(order.confirmed_at), 0) /
          readyOrders.length /
          60_000,
      )
    : null;
  // 5. Jumlahkan porsi per menu dari pesanan yang sudah dibayar/diproses hari ini, lalu ambil yang terbanyak.
  const portionsByMenu = new Map<number, { name: string; portions: number }>();
  for (const order of orders) {
    if (!PAID_FLOW_STATUSES.has(order.status) || !isToday(order.created_at)) continue;
    for (const item of order.items) {
      const entry = portionsByMenu.get(item.menu_id) ?? { name: item.menu_name, portions: 0 };
      portionsByMenu.set(item.menu_id, { ...entry, portions: entry.portions + item.qty });
    }
  }
  const bestSeller = [...portionsByMenu.values()].reduce<TodaySummary["bestSeller"]>(
    (best, entry) => (!best || entry.portions > best.portions ? entry : best),
    null,
  );
  return { revenue, capacity, needsAction: countNeedsAction(orders), averageReadyMinutes, bestSeller };
}
