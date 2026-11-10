import { formatJam, formatTanggal, geserWib } from "./format";
import { tampilanStatus } from "./order-status";
import type { MerchantOrder } from "@/types/order";

/**
 * SH-N1: jumlah pesanan yang menunggu tindakan penjual: menunggu konfirmasi + terkonfirmasi.
 * F26: VA/bayar online yang belum lunas tidak dihitung; Midtrans menerimanya otomatis begitu lunas.
 */
export function perluTindakan(orders: Pick<MerchantOrder, "status" | "payment_method" | "payment_status">[]): number {
  return orders.filter((o) => o.status === "confirmed" || tampilanStatus(o) === "menunggu-konfirmasi").length;
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

/** SH-N1: pilihan lebar sidebar di layar ≥ 1280 px. Disimpan di cookie agar layout server langsung merender yang benar (tanpa kedip). */
export const COOKIE_SIDEBAR = "kk-sidebar";
export type ModeSidebar = "lebar" | "ringkas";
export const modeSidebar = (nilai: string | undefined): ModeSidebar => (nilai === "ringkas" ? "ringkas" : "lebar");
