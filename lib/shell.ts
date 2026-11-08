import { formatJam, formatTanggal, geserWib } from "./format";
import type { MerchantOrder } from "@/types/order";

/** SH-N1: jumlah pesanan yang menunggu tindakan penjual (menunggu + terkonfirmasi). */
export function perluTindakan(orders: Pick<MerchantOrder, "status">[]): number {
  return orders.filter((o) => o.status === "holding" || o.status === "confirmed").length;
}

const menit = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** SH-A1: apakah `ms` di luar rentang buka (WIB). Tepat jam tutup dihitung di luar; tutup < buka berarti lewat tengah malam. */
export function diLuarJamBuka(ms: number, buka: string, tutup: string): boolean {
  const w = geserWib(ms);
  const sekarang = w.getUTCHours() * 60 + w.getUTCMinutes();
  const b = menit(buka);
  const t = menit(tutup);
  const dalam = b <= t ? sekarang >= b && sekarang < t : sekarang >= b || sekarang < t;
  return !dalam;
}

/** "07:00","16:00" -> "07.00–16.00" */
export const labelJamBuka = (buka: string, tutup: string) => `${buka.replace(":", ".")}–${tutup.replace(":", ".")}`;

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/** "Sab, 31 Okt · 11.42 WIB" */
export function formatHariJam(ms: number): string {
  const iso = new Date(ms).toISOString();
  const hari = HARI[geserWib(ms).getUTCDay()];
  return `${hari}, ${formatTanggal(iso).replace(/ \d{4}$/, "")} · ${formatJam(iso)} WIB`;
}

export function inisial(nama: string): string {
  const k = nama.trim().split(/\s+/).filter(Boolean);
  return k.length ? k.slice(0, 2).map((x) => x[0].toUpperCase()).join("") : "?";
}
