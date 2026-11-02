// Tipe disalin dari docs/API.md (§1, §7). Uang = integer Rupiah, waktu = ISO-8601 UTC.

export type ApiError = { code: string; message: string; fields?: Record<string, string[]> };
export type DataResult<T> =
  | { data: T; meta?: { page: number; limit: number; total: number } }
  | { error: ApiError };
export type ActionResult<T> = { data: T } | { error: ApiError };

export type OrderStatus = "holding" | "confirmed" | "cooking" | "ready" | "completed" | "cancelled" | "expired";
export type PaymentMethod = "cod" | "qris" | "va";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "expired" | "refunded";

export type Category = { id: number; name: string; slug: string };
export type PickupPoint = { id: number; name: string };
export type MerchantType = { id: number; name: string };

export type MenuOption = { id: number; name: string; extra_price: number };

export type MerchantMenu = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  category: Category;
  unit_label: string;
  price: number;
  hpp: number;
  margin: number; // price - hpp
  daily_quota: number;
  quota_today: number;
  sold_today: number;
  held_today: number;
  available: number;
  prep_minutes: number;
  is_preorder: boolean;
  preorder_days: number;
  min_order_qty: number;
  is_active: boolean;
  options: MenuOption[];
  rating_avg: number;
  rating_count: number;
};

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

export type MerchantProfile = {
  business_name: string;
  description: string | null;
  address: string;
  wa_number: string;
  logo_url: string | null;
  merchant_type: MerchantType;
  service_mode: "daily" | "event" | "both";
  is_open: boolean;
  open_time: string; // "HH:MM"
  close_time: string;
  hold_minutes: number;
  daily_revenue_target: number;
  qris_image_url: string | null;
  wa_template: string | null;
  pickup_point_ids: number[];
};

export type ReportSummary = {
  target: number;
  revenue: number;
  hpp_total: number;
  profit: number;
  achievement_pct: number;
};

export type HourlyPoint = { hour: number; orders: number; portions: number; revenue: number };

export type Transaction = {
  code: string;
  created_at: string;
  customer_name: string;
  payment_method: PaymentMethod;
  menu_name: string;
  qty: number;
  total: number;
  hpp_total: number;
  status: OrderStatus;
};

export type Promo = {
  id: number;
  code: string;
  description: string | null;
  type: "percent" | "fixed" | "free_service_fee";
  value: number;
  max_discount: number | null;
  min_subtotal: number;
  quota: number | null;
  used_count: number;
  per_user_limit: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

export type Review = {
  id: number;
  menu_id: number;
  menu_name: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};
