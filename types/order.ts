// Bentuk data pesanan dari backend (GET /merchant/orders). Nama properti mengikuti JSON backend.

import type { MenuOption } from "@/types/menu";
import type { PickupPoint } from "@/types/meta";

/**
 * Tahap pesanan: menunggu (holding), dikonfirmasi, dimasak, siap, selesai, dibatalkan, atau kedaluwarsa.
 */
export type OrderStatus = "holding" | "confirmed" | "cooking" | "ready" | "completed" | "cancelled" | "expired";
/**
 * Cara bayar. `online` = halaman bayar Midtrans; `qris` = QRIS statis toko yang sudah tidak dipakai, hanya ada di riwayat lama.
 */
export type PaymentMethod = "cod" | "qris" | "va" | "online";
/** Status pembayaran, sama dengan kolom orders.payment_status di database. */
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

/** Satu baris menu di dalam pesanan. */
export type OrderItem = {
  menu_id: number;
  menu_name: string;
  qty: number;
  unit_price: number;
  options: MenuOption[];
  line_total: number;
};

/** Satu pesanan lengkap seperti yang dilihat penjual, termasuk waktu tiap tahap statusnya. */
export type MerchantOrder = {
  code: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  hold_until: string | null;
  seconds_left: number | null;
  pickup_point: PickupPoint | null; // null = pesanan meja
  table: { id: number; label: string } | null; // diisi bila pesanan dibuat dari meja (pesan dari meja)
  pickup_at: string | null; // null = secepatnya
  items: OrderItem[];
  subtotal: number;
  discount: number;
  service_fee: number;
  total: number;
  note: string | null;
  customer_name: string;
  customer_phone: string | null; // tamu meja boleh tanpa nomor
  cancel_reason: string | null;
  cancelled_by: "customer" | "merchant" | "system" | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  cooking_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};
