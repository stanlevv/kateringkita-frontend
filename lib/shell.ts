import { formatTime, formatDate, toWibClock } from "./format";
import { displayStatus } from "./order-status";
import type { MerchantOrder } from "@/types/order";

/**
 * SH-N1: jumlah pesanan yang menunggu tindakan penjual: menunggu konfirmasi + terkonfirmasi.
 * F26: VA/bayar online yang belum lunas tidak dihitung; Midtrans menerimanya otomatis begitu lunas.
 */
export function countNeedsAction(
  orders: Pick<MerchantOrder, "status" | "payment_method" | "payment_status">[],
): number {
  return orders.filter((order) => order.status === "confirmed" || displayStatus(order) === "menunggu-konfirmasi")
    .length;
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** SH-A1: apakah `ms` di luar rentang buka (WIB). Tepat jam tutup dihitung di luar; tutup < buka berarti lewat tengah malam. */
export function isOutsideOpenHours(timestamp: number, openTime: string, closeTime: string): boolean {
  const clock = toWibClock(timestamp);
  const nowMinutes = clock.getUTCHours() * 60 + clock.getUTCMinutes();
  const openMinutes = toMinutes(openTime);
  const closeMinutes = toMinutes(closeTime);
  const isOpen =
    openMinutes <= closeMinutes
      ? nowMinutes >= openMinutes && nowMinutes < closeMinutes
      : nowMinutes >= openMinutes || nowMinutes < closeMinutes;
  return !isOpen;
}

/** "07:00","16:00" -> "07.00–16.00" */
export const openHoursLabel = (openTime: string, closeTime: string) =>
  `${openTime.replace(":", ".")}–${closeTime.replace(":", ".")}`;

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/** "Sab, 31 Okt · 11.42 WIB" */
export function formatDayTime(timestamp: number): string {
  const iso = new Date(timestamp).toISOString();
  const day = DAY_NAMES[toWibClock(timestamp).getUTCDay()];
  return `${day}, ${formatDate(iso).replace(/ \d{4}$/, "")} · ${formatTime(iso)} WIB`;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length
    ? words
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("")
    : "?";
}

/** SH-N1: pilihan lebar sidebar di layar ≥ 1280 px. Disimpan di cookie agar layout server langsung merender yang benar (tanpa kedip). */
export const SIDEBAR_COOKIE = "kk-sidebar";
export type SidebarMode = "lebar" | "ringkas";
export const parseSidebarMode = (value: string | undefined): SidebarMode => (value === "ringkas" ? "ringkas" : "lebar");
