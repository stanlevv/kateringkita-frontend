import type { OrderStatus, PaymentMethod } from "@/types/order";

export type ReportSummary = {
  target: number;
  revenue: number;
  hpp_total: number;
  profit: number;
  achievement_pct: number;
  orders: number;
};

export type HourlyPoint = { hour: number; orders: number; portions: number; revenue: number };

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
