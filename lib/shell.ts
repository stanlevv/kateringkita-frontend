// Pembantu "shell" dashboard penjual (kerangka halaman: sidebar, header, banner jam buka).

import { formatTime, formatDate, toWibClock } from "./format";
import { displayStatus } from "./order-status";
import type { MerchantOrder } from "@/types/order";

/**
 * Menghitung pesanan yang menunggu tindakan penjual: menunggu konfirmasi ditambah sudah dikonfirmasi.
 * Pesanan VA/online yang belum lunas tidak dihitung, karena Midtrans menerimanya otomatis begitu lunas.
 * @param orders pesanan (cukup status dan data pembayaran)
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

/**
 * Mengecek apakah suatu waktu berada di luar jam buka toko (WIB).
 * Tepat jam tutup dihitung di luar; jam tutup lebih kecil dari jam buka berarti toko buka melewati tengah malam.
 * @param timestamp waktu dalam milidetik
 * @param openTime jam buka "HH:MM"
 * @param closeTime jam tutup "HH:MM"
 */
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

/** Menulis jam buka, mis. "07:00","16:00" menjadi "07.00–16.00". */
export const openHoursLabel = (openTime: string, closeTime: string) =>
  `${openTime.replace(":", ".")}–${closeTime.replace(":", ".")}`;

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/**
 * Menulis hari dan jam WIB, mis. "Sab, 31 Okt · 11.42 WIB".
 * @param timestamp waktu dalam milidetik
 */
export function formatDayTime(timestamp: number): string {
  const iso = new Date(timestamp).toISOString();
  const day = DAY_NAMES[toWibClock(timestamp).getUTCDay()];
  return `${day}, ${formatDate(iso).replace(/ \d{4}$/, "")} · ${formatTime(iso)} WIB`;
}

/**
 * Mengambil inisial nama (paling banyak 2 huruf), mis. "Dapur Diego" menjadi "DD"; "?" bila nama kosong.
 * @param name nama
 */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length
    ? words
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("")
    : "?";
}

/**
 * Nama cookie pilihan lebar sidebar (layar 1280 px ke atas). Disimpan di cookie agar server langsung merender lebar yang benar tanpa kedip.
 */
export const SIDEBAR_COOKIE = "kk-sidebar";
/** Lebar sidebar: lebar atau ringkas. */
export type SidebarMode = "lebar" | "ringkas";
/**
 * Membaca mode sidebar dari nilai cookie; selain "ringkas" dianggap "lebar".
 * @param value nilai cookie
 */
export const parseSidebarMode = (value: string | undefined): SidebarMode => (value === "ringkas" ? "ringkas" : "lebar");
