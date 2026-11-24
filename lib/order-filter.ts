// Penyaring dan ringkasan untuk halaman daftar pesanan penjual.

import type { OrderStatus } from "@/types/order";

/** Jumlah pesanan per halaman. */
export const LIMIT_ORDERS = 20;

/** Pilihan penyaring status di halaman daftar pesanan. */
export const STATUS_FILTER: { id: OrderStatus; label: string }[] = [
  { id: "holding", label: "Menunggu" },
  { id: "confirmed", label: "Dikonfirmasi" },
  { id: "cooking", label: "Dimasak" },
  { id: "ready", label: "Siap diambil" },
  { id: "completed", label: "Selesai" },
  { id: "cancelled", label: "Dibatalkan" },
  { id: "expired", label: "Kadaluarsa" },
];

/**
 * Meringkas isi pesanan menjadi satu baris, mis. "2× Nasi Ayam, +1 lainnya".
 * @param order pesanan (cukup `items`)
 * @returns teks ringkasan, atau "-" bila tidak ada item
 */
export function summarizeItems({ items }: { items: { qty: number; menu_name: string }[] }) {
  const [first] = items;
  if (!first) return "-";
  return `${first.qty}× ${first.menu_name}${items.length > 1 ? `, +${items.length - 1} lainnya` : ""}`;
}
