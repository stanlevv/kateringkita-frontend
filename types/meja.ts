import type { MenuOption } from "@/types/menu";
import type { OrderItem, OrderStatus, PaymentStatus } from "@/types/order";

// F21 pesan dari meja (kontrak backend: GET /tables/:token, /guest/orders/:code, /merchant/tables)
export type Meja = { id: number; label: string; token: string; is_active: boolean };

export type MenuMejaItem = {
  id: number;
  name: string;
  image_url: string | null;
  price: number;
  unit_label: string;
  category: { id: number; name: string; slug: string };
  available: number;
  badge: "sold_out" | "preorder" | "low_stock" | "available";
  rating_avg: number;
  rating_count: number;
  description: string | null;
  min_order_qty: number;
  options: MenuOption[];
};

export type MenuMeja = {
  table: { label: string };
  merchant: {
    slug: string; business_name: string; description: string | null; logo_url: string | null;
    is_open: boolean; open_time: string; close_time: string;
  };
  menus: MenuMejaItem[];
};

export type PesananMeja = {
  code: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  table: { label: string };
  merchant: { slug: string; business_name: string };
  customer_name: string;
  note: string | null;
  items: OrderItem[];
  subtotal: number;
  service_fee: number;
  total: number;
  hold_until: string | null;
  seconds_left: number | null;
  payment_url: string | null;
  created_at: string;
};
