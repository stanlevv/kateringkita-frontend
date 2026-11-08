import type { MenuOption } from "@/types/menu";
import type { PickupPoint } from "@/types/meta";

export type OrderStatus = "holding" | "confirmed" | "cooking" | "ready" | "completed" | "cancelled" | "expired";
export type PaymentMethod = "cod" | "qris" | "va";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "expired" | "refunded";

export type OrderItem = {
  menu_id: number;
  menu_name: string;
  qty: number;
  unit_price: number;
  options: MenuOption[];
  line_total: number;
};

export type MerchantOrder = {
  code: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  hold_until: string | null;
  seconds_left: number | null;
  pickup_point: PickupPoint;
  pickup_at: string | null; // null = secepatnya
  items: OrderItem[];
  subtotal: number;
  discount: number;
  service_fee: number;
  total: number;
  note: string | null;
  customer_name: string;
  customer_phone: string;
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
