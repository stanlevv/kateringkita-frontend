import { formatJam, jamWib, tanggalWib } from "./format";
import type { HourlyPoint, Transaction } from "./types";

export const MAKS_HARI = 92;

const POLA = /^\d{4}-\d{2}-\d{2}$/;
const ms = (d: string) => Date.parse(`${d}T00:00:00Z`);
const sah = (d: string) => POLA.test(d) && !Number.isNaN(ms(d)) && new Date(ms(d)).toISOString().slice(0, 10) === d;

/** Jumlah hari dalam rentang, ujung-ujungnya ikut dihitung. */
export const jumlahHari = (dari: string, sampai: string) => Math.round((ms(sampai) - ms(dari)) / 86400e3) + 1;

/** LP-E1: pesan galat untuk rentang yang tidak boleh dipakai, atau null. */
export function cekRentang(dari: string, sampai: string, hariIni: string): string | null {
  if (!sah(dari) || !sah(sampai)) return "Tanggal tidak valid.";
  if (sampai < dari) return "Tanggal akhir harus setelah tanggal awal.";
  if (sampai > hariIni || dari > hariIni) return "Tanggal tidak boleh melewati hari ini.";
  if (jumlahHari(dari, sampai) > MAKS_HARI) return `Rentang maksimal ${MAKS_HARI} hari.`;
  return null;
}

/** Rentang dari URL; kosong atau tidak sah -> hari ini (galat hanya bila ada isian yang ditolak). */
export function parseRentang(dari: string | undefined, sampai: string | undefined, hariIni: string) {
  const bawaan = { dari: hariIni, sampai: hariIni };
  if (!dari && !sampai) return { ...bawaan, galat: null };
  if (!dari || !sampai) return { ...bawaan, galat: "Lengkapi tanggal awal dan akhir." };
  const galat = cekRentang(dari, sampai, hariIni);
  return galat ? { ...bawaan, galat } : { dari, sampai, galat: null };
}

/** Tanggal (YYYY-MM-DD, WIB) `n` hari sebelum `d`. */
export const hariSebelum = (d: string, n: number) => new Date(ms(d) - n * 86400e3).toISOString().slice(0, 10);

/** LP-N2: total per jam WIB, urut jam; jam tanpa transaksi tidak muncul. */
export function perJam(list: Transaction[]): HourlyPoint[] {
  const peta = new Map<number, HourlyPoint>();
  for (const t of list) {
    const hour = jamWib(t.created_at);
    const p = peta.get(hour) ?? { hour, orders: 0, portions: 0, revenue: 0 };
    p.orders += 1;
    p.portions += t.qty;
    p.revenue += t.total;
    peta.set(hour, p);
  }
  return [...peta.values()].sort((a, b) => a.hour - b.hour);
}

// Teks yang diawali karakter rumus dibuat aman agar tidak dijalankan aplikasi spreadsheet.
function teks(v: string) {
  const aman = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(aman) ? `"${aman.replaceAll('"', '""')}"` : aman;
}

/** LP-N4: isi CSV (kode,waktu,menu,qty,omzet,hpp,laba,metode). */
export function buatCsv(list: Transaction[]): string {
  const baris = list.map((t) =>
    [
      teks(t.code),
      teks(`${tanggalWib(t.created_at)} ${formatJam(t.created_at).replace(".", ":")}`),
      teks(t.menu_name),
      t.qty,
      t.total,
      t.hpp_total,
      t.total - t.hpp_total,
      teks(t.payment_method),
    ].join(","),
  );
  return ["kode,waktu,menu,qty,omzet,hpp,laba,metode", ...baris].join("\r\n") + "\r\n";
}
