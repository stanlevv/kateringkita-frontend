import { formatTime, wibHour, wibDate } from "./format";
import type { HourlyPoint, Transaction } from "@/types/report";

export const MAX_RANGE_DAYS = 92;
// Di sini, bukan di komponen "use client": halaman server hanya menerima nilainya dari modul biasa.
export const LIMIT_TRANSACTIONS = 20;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const dayStartMs = (date: string) => Date.parse(`${date}T00:00:00Z`);
const isValidDate = (date: string) =>
  DATE_PATTERN.test(date) &&
  !Number.isNaN(dayStartMs(date)) &&
  new Date(dayStartMs(date)).toISOString().slice(0, 10) === date;

/** Jumlah hari dalam rentang, ujung-ujungnya ikut dihitung. */
export const countDays = (from: string, to: string) => Math.round((dayStartMs(to) - dayStartMs(from)) / 86400e3) + 1;

/** AUD-48: unduhan CSV yang sah selalu fetch dari halaman kita (same-origin). Navigasi dari situs lain dijawab seperti
 *  tanpa sesi agar tidak membocorkan siapa yang sedang login. Header kosong (peramban lama) dibiarkan. */
export const isCrossSiteRequest = (request: Request) => {
  const fetchSite = request.headers.get("sec-fetch-site");
  return fetchSite !== null && fetchSite !== "same-origin";
};

/** LP-E1: pesan galat untuk rentang yang tidak boleh dipakai, atau null. */
export function validateRange(from: string, to: string, today: string): string | null {
  if (!isValidDate(from) || !isValidDate(to)) return "Tanggal tidak valid.";
  if (to < from) return "Tanggal akhir harus setelah tanggal awal.";
  if (to > today || from > today) return "Tanggal tidak boleh melewati hari ini.";
  if (countDays(from, to) > MAX_RANGE_DAYS) return `Rentang maksimal ${MAX_RANGE_DAYS} hari.`;
  return null;
}

/** Rentang dari URL; kosong atau tidak sah -> hari ini (galat hanya bila ada isian yang ditolak). */
export function parseRange(from: string | undefined, to: string | undefined, today: string) {
  const fallback = { from: today, to: today };
  if (!from && !to) return { ...fallback, error: null };
  if (!from || !to) return { ...fallback, error: "Lengkapi tanggal awal dan akhir." };
  const error = validateRange(from, to, today);
  return error ? { ...fallback, error } : { from, to, error: null };
}

/** Tanggal (YYYY-MM-DD, WIB) `n` hari sebelum `d`. */
export const daysBefore = (date: string, days: number) =>
  new Date(dayStartMs(date) - days * 86400e3).toISOString().slice(0, 10);

/** LP-N2: total per jam WIB, urut jam; jam tanpa transaksi tidak muncul. Satu pesanan = satu `code`, walau punya banyak baris menu. */
export function groupByHour(transactions: Transaction[]): HourlyPoint[] {
  const byHour = new Map<number, HourlyPoint>();
  const countedOrders = new Set<string>();
  for (const transaction of transactions) {
    const hour = wibHour(transaction.completed_at);
    const point = byHour.get(hour) ?? { hour, orders: 0, portions: 0, revenue: 0 };
    if (!countedOrders.has(`${hour}|${transaction.code}`)) {
      countedOrders.add(`${hour}|${transaction.code}`);
      point.orders += 1;
    }
    point.portions += transaction.qty;
    point.revenue += transaction.total;
    byHour.set(hour, point);
  }
  return [...byHour.values()].sort((first, second) => first.hour - second.hour);
}

// Teks yang diawali karakter rumus dibuat aman agar tidak dijalankan aplikasi spreadsheet.
function toCsvCell(value: string) {
  const safeText = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safeText) ? `"${safeText.replaceAll('"', '""')}"` : safeText;
}

// F20: dipakai juga CSV keuangan admin (lib/finance.ts)
export const csvCell = toCsvCell;

/** LP-N4: isi CSV (kode,waktu,menu,qty,omzet,hpp,laba,metode). */
export function createTransactionsCsv(transactions: Transaction[]): string {
  const rows = transactions.map((transaction) =>
    [
      toCsvCell(transaction.code),
      toCsvCell(`${wibDate(transaction.completed_at)} ${formatTime(transaction.completed_at).replace(".", ":")}`),
      toCsvCell(transaction.menu_name),
      transaction.qty,
      transaction.total,
      transaction.hpp_total,
      transaction.total - transaction.hpp_total,
      toCsvCell(transaction.payment_method),
    ].join(","),
  );
  return ["kode,waktu,menu,qty,omzet,hpp,laba,metode", ...rows].join("\r\n") + "\r\n";
}
