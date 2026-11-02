import { hariSebelum, jumlahHari, perJam } from "../laporan";
import type { HourlyPoint, PaymentMethod, ReportSummary, Transaction } from "../types";
import { menus } from "./menus";
import { profile } from "./profile";

const METODE: PaymentMethod[] = ["cod", "qris", "va"];
const HURUF = "ABCDEFGHJKLMNPQRSTUVWXYZ234567";

// Pembangkit acak deterministik: tanggal yang sama selalu menghasilkan data yang sama.
function acak(tanggal: string) {
  let x = 2166136261;
  for (const c of tanggal) x = Math.imul(x ^ c.charCodeAt(0), 16777619);
  return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32;
}

/** Transaksi selesai satu hari (WIB), urut terbaru dulu. */
function transaksiHari(tanggal: string): Transaction[] {
  const next = acak(tanggal);
  const katalog = menus();
  const [th, bl, hr] = tanggal.split("-").map(Number);
  const n = 3 + Math.floor(next() * 4);
  return Array.from({ length: n }, (_, i) => {
    const m = katalog[Math.floor(next() * katalog.length)];
    const qty = 1 + Math.floor(next() * 4);
    const jam = 8 + Math.floor(next() * 8);
    const menit = Math.floor(next() * 60);
    const kode = `KK-${tanggal.replaceAll("-", "")}-${HURUF[i]}${[0, 0, 0].map(() => HURUF[Math.floor(next() * HURUF.length)]).join("")}`;
    return {
      code: kode,
      created_at: new Date(Date.UTC(th, bl - 1, hr, jam - 7, menit)).toISOString(),
      customer_name: "Pembeli",
      payment_method: METODE[Math.floor(next() * 3)],
      menu_name: m.name,
      qty,
      total: m.price * qty,
      hpp_total: m.hpp * qty,
      status: "completed" as const,
    };
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Transaksi selesai dalam rentang tanggal (WIB), terbaru dulu. */
export function transaksi(dari: string, sampai: string): Transaction[] {
  return Array.from({ length: jumlahHari(dari, sampai) }, (_, i) => transaksiHari(hariSebelum(sampai, i))).flat();
}

export function ringkasan(dari: string, sampai: string): ReportSummary {
  const list = transaksi(dari, sampai);
  const target = profile().daily_revenue_target * jumlahHari(dari, sampai);
  const revenue = list.reduce((a, t) => a + t.total, 0);
  const hpp_total = list.reduce((a, t) => a + t.hpp_total, 0);
  return { target, revenue, hpp_total, profit: revenue - hpp_total, achievement_pct: target ? Math.round((revenue / target) * 100) : 0 };
}

export const hourly = (tanggal: string): HourlyPoint[] => perJam(transaksiHari(tanggal));
