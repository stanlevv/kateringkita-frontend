import type { OrderStatus } from "@/types/order";

export const LIMIT_ORDERS = 20;

export const STATUS_FILTER: { id: OrderStatus; label: string }[] = [
  { id: "holding", label: "Menunggu" },
  { id: "confirmed", label: "Dikonfirmasi" },
  { id: "cooking", label: "Dimasak" },
  { id: "ready", label: "Siap diambil" },
  { id: "completed", label: "Selesai" },
  { id: "cancelled", label: "Dibatalkan" },
  { id: "expired", label: "Kadaluarsa" },
];

/** "2× Nasi Ayam, +1 lainnya". */
export function summarizeItems({ items }: { items: { qty: number; menu_name: string }[] }) {
  const [first] = items;
  if (!first) return "-";
  return `${first.qty}× ${first.menu_name}${items.length > 1 ? `, +${items.length - 1} lainnya` : ""}`;
}
