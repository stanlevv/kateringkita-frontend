// Aturan halaman Laporan penjual: rentang tanggal yang boleh, pengelompokan per jam, dan pembuatan file CSV.
// Dipakai halaman /laporan, halaman keuangan admin, dan route unduhan CSV.

import { formatTime, wibHour, wibDate } from "./format";
import type { HourlyPoint, Transaction } from "@/types/report";

/** Rentang laporan paling panjang (hari). */
export const MAX_RANGE_DAYS = 92;
/**
 * Jumlah transaksi per halaman. Ditaruh di modul biasa (bukan "use client") karena halaman server perlu membaca nilainya.
 */
export const LIMIT_TRANSACTIONS = 20;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const dayStartMs = (date: string) => Date.parse(`${date}T00:00:00Z`);
const isValidDate = (date: string) =>
  DATE_PATTERN.test(date) &&
  !Number.isNaN(dayStartMs(date)) &&
  new Date(dayStartMs(date)).toISOString().slice(0, 10) === date;

/**
 * Menghitung jumlah hari dalam rentang, tanggal awal dan akhir ikut dihitung.
 * @param from tanggal awal (YYYY-MM-DD)
 * @param to tanggal akhir (YYYY-MM-DD)
 */
export const countDays = (from: string, to: string) => Math.round((dayStartMs(to) - dayStartMs(from)) / 86400e3) + 1;

/**
 * Mengecek apakah permintaan datang dari situs lain (header Sec-Fetch-Site).
 * Unduhan CSV yang sah selalu di-fetch dari halaman kita sendiri. Permintaan dari situs lain dijawab seperti
 * tanpa sesi agar tidak membocorkan siapa yang sedang login. Header kosong (browser lama) dibiarkan lewat.
 * @param request permintaan yang masuk
 * @returns true bila berasal dari situs lain
 */
export const isCrossSiteRequest = (request: Request) => {
  const fetchSite = request.headers.get("sec-fetch-site");
  return fetchSite !== null && fetchSite !== "same-origin";
};

/**
 * Memeriksa rentang tanggal laporan: format sah, akhir tidak sebelum awal, tidak melewati hari ini, dan paling panjang 92 hari.
 * @param from tanggal awal
 * @param to tanggal akhir
 * @param today tanggal hari ini (WIB)
 * @returns pesan galat, atau null bila rentang boleh dipakai
 */
export function validateRange(from: string, to: string, today: string): string | null {
  if (!isValidDate(from) || !isValidDate(to)) return "Tanggal tidak valid.";
  if (to < from) return "Tanggal akhir harus setelah tanggal awal.";
  if (to > today || from > today) return "Tanggal tidak boleh melewati hari ini.";
  if (countDays(from, to) > MAX_RANGE_DAYS) return `Rentang maksimal ${MAX_RANGE_DAYS} hari.`;
  return null;
}

/**
 * Membaca rentang tanggal dari URL. Bila kosong atau tidak sah, rentang menjadi hari ini.
 * @param from nilai `dari` dari URL
 * @param to nilai `sampai` dari URL
 * @param today tanggal hari ini (WIB)
 * @returns `{ from, to, error }`; `error` berisi pesan hanya bila ada isian yang ditolak
 */
export function parseRange(from: string | undefined, to: string | undefined, today: string) {
  const fallback = { from: today, to: today };
  if (!from && !to) return { ...fallback, error: null };
  if (!from || !to) return { ...fallback, error: "Lengkapi tanggal awal dan akhir." };
  const error = validateRange(from, to, today);
  return error ? { ...fallback, error } : { from, to, error: null };
}

/**
 * Tanggal (YYYY-MM-DD) sekian hari sebelum tanggal tertentu.
 * @param date tanggal acuan
 * @param days jumlah hari mundur
 */
export const daysBefore = (date: string, days: number) =>
  new Date(dayStartMs(date) - days * 86400e3).toISOString().slice(0, 10);

/**
 * Menjumlahkan transaksi per jam WIB, urut dari jam terkecil. Jam tanpa transaksi tidak muncul.
 * Satu pesanan dihitung sekali per jam walau punya beberapa baris menu.
 * @param transactions transaksi selesai
 * @returns angka per jam: jumlah pesanan, porsi, dan omzet
 */
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

/**
 * Menyiapkan satu sel teks CSV (dipakai juga CSV keuangan admin di lib/finance.ts).
 * Teks yang diawali karakter rumus (=, +, -, @) diberi tanda kutip tunggal agar tidak dijalankan aplikasi spreadsheet.
 */
export const csvCell = toCsvCell;

/**
 * Membuat isi CSV transaksi dengan kolom kode, waktu, menu, qty, omzet, hpp, laba, metode.
 * @param transactions transaksi selesai
 * @returns teks CSV dengan akhir baris CRLF
 */
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
