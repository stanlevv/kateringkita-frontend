import { toWibClock, wibDate } from "./format";
import { nextStatus, type OrderAction } from "./order-status";
import { countNeedsAction } from "./shell";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";

/** Salinan `rec` dengan `key` diganti, atau dihapus bila `v` undefined. */
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

/** Aksi yang sedang tertunda/terkirim; `dasar` = `updated_at` server saat aksi dipilih (D14). */
export type OptimisticActions = Record<string, { action: OrderAction; baseUpdatedAt: string }>;

/**
 * Tampilkan status tujuan selama `updated_at` server masih sama dengan `dasar`; begitu data baru datang
 * (refresh/polling) entri gugur sendiri dan objek server dipakai apa adanya. `updated_at` tetap milik server.
 */
export function applyOptimisticActions(orders: MerchantOrder[], actions: OptimisticActions): MerchantOrder[] {
  return orders.map((order) => {
    const action = actions[order.code];
    if (!action || action.baseUpdatedAt !== order.updated_at) return order;
    const next = nextStatus(order, action.action);
    return "error" in next ? order : { ...next, updated_at: order.updated_at };
  });
}

/** Buang entri yang `dasar`-nya tak cocok lagi dengan data server; objek sama bila tak ada yang dibuang. */
export function pruneOptimisticActions(orders: MerchantOrder[], actions: OptimisticActions): OptimisticActions {
  const kept = Object.entries(actions).filter(([code, action]) =>
    orders.some((order) => order.code === code && order.updated_at === action.baseUpdatedAt),
  );
  return kept.length === Object.keys(actions).length ? actions : Object.fromEntries(kept);
}

/** Detik tahan tersisa dari `hold_until`. */
export function holdSecondsLeft(order: MerchantOrder, now: number): number | null {
  if (order.status !== "holding" || !order.hold_until) return null;
  return Math.max(0, Math.ceil((Date.parse(order.hold_until) - now) / 1000));
}

/** DB-A4: holding yang waktunya habis ditampilkan Kadaluarsa (server akan menyusul lewat polling). */
export function applyHoldExpiry(orders: MerchantOrder[], now: number): MerchantOrder[] {
  return orders.map((order) => (holdSecondsLeft(order, now) === 0 ? { ...order, status: "expired" } : order));
}

export type QueueTab = "tindakan" | "dimasak" | "siap" | "semua";

const toTimestamp = (iso: string | null) => (iso ? Date.parse(iso) : 0);
const ascendingBy = (getValue: (order: MerchantOrder) => number) => (first: MerchantOrder, second: MerchantOrder) =>
  getValue(first) - getValue(second);
export const NEW_ORDER_MS = 60_000;
const EXPIRED_VISIBLE_MS = 3000;

export function queueForTab(orders: MerchantOrder[], tab: QueueTab, now: number): MerchantOrder[] {
  const ofStatus = (status: MerchantOrder["status"]) => orders.filter((order) => order.status === status);
  switch (tab) {
    case "tindakan": {
      // DB-A4: kadaluarsa barusan tetap terlihat 3 dtk. Brief §6: pesanan baru di atas, sisanya paling cepat habis dulu.
      const holdingOrders = orders.filter(
        (order) =>
          order.status === "holding" ||
          (order.status === "expired" && order.hold_until && now - toTimestamp(order.hold_until) < EXPIRED_VISIBLE_MS),
      );
      const newOrders = holdingOrders
        .filter((order) => order.status === "holding" && now - toTimestamp(order.created_at) < NEW_ORDER_MS)
        .sort(ascendingBy((order) => -toTimestamp(order.created_at)));
      const otherOrders = holdingOrders
        .filter((order) => !newOrders.includes(order))
        .sort(ascendingBy((order) => toTimestamp(order.hold_until)));
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

export function countQueueTabs(orders: MerchantOrder[]): Record<QueueTab, number> {
  const countStatus = (status: MerchantOrder["status"]) => orders.filter((order) => order.status === status).length;
  return {
    tindakan: countNeedsAction(orders),
    dimasak: countStatus("cooking"),
    siap: countStatus("ready"),
    semua: orders.length,
  };
}

export type StockLevel = "habis" | "menipis" | "aman";
export const menuStockLevel = (menu: Pick<MerchantMenu, "available">): StockLevel =>
  menu.available <= 0 ? "habis" : menu.available <= 3 ? "menipis" : "aman";

const STOCK_RANK: Record<StockLevel, number> = { habis: 0, menipis: 1, aman: 2 };
/** Brief §5: Habis -> Menipis (<= 3) -> Aman; hanya menu aktif. */
export const sortMenusByStock = (menus: MerchantMenu[]) =>
  menus
    .filter((menu) => menu.is_active)
    .sort((first, second) => STOCK_RANK[menuStockLevel(first)] - STOCK_RANK[menuStockLevel(second)]);

/**
 * D5: per `code`, baris masuk menang bila `updated_at` >= yang ada; baris dengan `updated_at` & status sama
 * dianggap tak berubah, sehingga respons identik mengembalikan referensi yang sama.
 */
export function mergeOrders(current: MerchantOrder[], incoming: MerchantOrder[]): MerchantOrder[] {
  const byCode = new Map(current.map((order) => [order.code, order]));
  let changed = false;
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
  return changed ? [...byCode.values()] : current;
}

/** D3: `updated_at` terbesar - 5 dtk (tumpang tindih), atau `cadangan` - 60 dtk bila belum ada pesanan. */
export function updatedSinceCursor(orders: MerchantOrder[], fallbackMs: number): string {
  if (orders.length === 0) return new Date(fallbackMs - 60_000).toISOString();
  return new Date(Math.max(...orders.map((order) => Date.parse(order.updated_at))) - 5000).toISOString();
}

/** D8: selisih jam server - jam klien dari pesanan `holding` pertama yang masih berjalan; null bila tidak ada. */
export function clockOffsetMs(orders: MerchantOrder[], receivedAt: number): number | null {
  const holdingOrder = orders.find(
    (order) => order.status === "holding" && order.hold_until && (order.seconds_left ?? 0) > 0,
  );
  return holdingOrder ? Date.parse(holdingOrder.hold_until!) - holdingOrder.seconds_left! * 1000 - receivedAt : null;
}

export type TodaySummary = {
  revenue: number;
  capacity: { used: number; total: number };
  needsAction: number;
  averageReadyMinutes: number | null;
  bestSeller: { name: string; portions: number } | null;
};

const PAID_FLOW_STATUSES = new Set<MerchantOrder["status"]>(["confirmed", "cooking", "ready", "completed"]);

/** D2 (M-04): KPI dari antrean & kuota yang sama dengan kartu; "hari ini" = tanggal WIB dari `sekarang`. */
export function summarizeToday(orders: MerchantOrder[], menus: MerchantMenu[], now: number): TodaySummary {
  const todayDate = toWibClock(now).toISOString().slice(0, 10);
  const isToday = (iso: string | null) => !!iso && wibDate(iso) === todayDate;
  const revenue = orders
    .filter((order) => order.status === "completed" && isToday(order.completed_at))
    .reduce((sum, order) => sum + order.subtotal, 0); // D10: sama dengan revenue laporan (tanpa biaya layanan)
  const activeMenus = menus.filter((menu) => menu.is_active);
  const capacity = {
    used: activeMenus.reduce((sum, menu) => sum + menu.sold_today + menu.held_today, 0),
    total: activeMenus.reduce((sum, menu) => sum + menu.quota_today, 0),
  };
  const readyOrders = orders.filter((order) => isToday(order.ready_at) && order.confirmed_at);
  const averageReadyMinutes = readyOrders.length
    ? Math.round(
        readyOrders.reduce((sum, order) => sum + toTimestamp(order.ready_at) - toTimestamp(order.confirmed_at), 0) /
          readyOrders.length /
          60_000,
      )
    : null;
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
