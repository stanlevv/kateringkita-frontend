// Bentuk data fitur pesan dari meja (GET /tables/:token, /guest/orders/:code, /merchant/tables).
// Pembeli memindai QR di meja, memesan tanpa akun, lalu pesanan diantar ke meja.

import type { MenuOption } from "@/types/menu";
import type { OrderItem, OrderStatus, PaymentStatus } from "@/types/order";

/** Satu meja toko. `token` adalah kode acak di QR meja. */
export type Table = { id: number; label: string; token: string; is_active: boolean };

/** Satu menu yang tampil di halaman pesan dari meja. */
export type TableMenuItem = {
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

/** Isi halaman pesan dari meja: label meja, data toko, dan daftar menu. */
export type TableMenu = {
  table: { label: string };
  merchant: {
    slug: string;
    business_name: string;
    description: string | null;
    logo_url: string | null;
    is_open: boolean;
    open_time: string;
    close_time: string;
  };
  menus: TableMenuItem[];
};

/** Pesanan tamu dari meja seperti yang dilihat tamu itu sendiri. */
export type TableOrder = {
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
