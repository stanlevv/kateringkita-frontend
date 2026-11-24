// Bentuk data laporan penjualan dari backend (GET /merchant/reports/...).

import type { OrderStatus, PaymentMethod } from "@/types/order";

/** Ringkasan laporan: target, omzet, total HPP, laba, persen capaian, dan jumlah pesanan. */
export type ReportSummary = {
  target: number;
  revenue: number;
  hpp_total: number;
  profit: number;
  achievement_pct: number;
  orders: number;
};

/** Angka penjualan pada satu jam (WIB). */
export type HourlyPoint = { hour: number; orders: number; portions: number; revenue: number };

/** Satu baris transaksi selesai (satu menu dalam satu pesanan). */
export type Transaction = {
  code: string;
  created_at: string;
  completed_at: string;
  customer_name: string;
  payment_method: PaymentMethod;
  menu_name: string;
  qty: number;
  total: number;
  hpp_total: number;
  status: OrderStatus;
};
