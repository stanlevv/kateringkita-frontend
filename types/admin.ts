// Cermin respons backend /api/v1/admin (be/src/admin/summary.ts, audit.ts).
export type StatusPesananAdmin = "holding" | "confirmed" | "cooking" | "ready" | "completed" | "cancelled" | "expired";

export type AuditLog = {
  id: number;
  admin_user_id: number;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
};

export type Ringkasan = {
  orders_today: Record<StatusPesananAdmin, number>;
  revenue_today: number;
  merchants: { pending: number; needs_fix: number; verified: number; suspended: number; open_now: number };
  holding_expiring_soon: number;
  recent_logs: AuditLog[];
};

export type MetaHalaman = { page: number; limit: number; total: number };

// be/src/admin/merchants.ts
export type StatusVerifikasi = "pending" | "needs_fix" | "verified" | "suspended";
export type Checklist = Record<"wa_valid" | "address" | "pickup_point" | "active_menu" | "menu_with_photo" | "opening_hours", boolean>;
export type AksiPenjual = "verify" | "request-fix" | "suspend" | "reactivate" | "close-today";

export type PenjualRingkas = {
  id: number; business_name: string; owner_name: string; wa_number: string;
  verification_status: StatusVerifikasi; is_open: boolean; menu_count: number; created_at: string;
};
export type AntrianPenjual = Omit<PenjualRingkas, "is_open" | "menu_count"> & {
  verification_note: string | null; checklist: Checklist; updated_after_note: boolean;
};
export type DetailPenjual = {
  id: number; business_name: string; address: string; wa_number: string; open_time: string; close_time: string;
  verification_status: StatusVerifikasi; verification_note: string | null; suspended_reason: string | null;
  is_open: boolean; created_at: string; merchant_type_name: string; menu_count: number;
  owner: { full_name: string; phone: string; email: string | null };
  pickup_points: { id: number; name: string }[];
  checklist: Checklist;
  recent_logs: AuditLog[];
};

// be/src/admin/master.ts
export type KindMaster = "categories" | "pickup-points" | "merchant-types";
export type ItemMaster = {
  id: number; name: string; is_active: boolean;
  icon?: string | null; description?: string | null; sort_order?: number;
};

// F19 be/src/services/admin-moderasi.service.ts
export type UlasanModerasi = {
  id: number; rating: number; comment: string | null; created_at: string; hidden: boolean; hidden_at: string | null; hidden_reason: string | null;
  menu: { id: number; name: string }; merchant: { id: number; business_name: string }; customer_name: string; order_code: string;
};
export type MenuModerasi = {
  id: number; name: string; price: number; image_url: string | null; is_active: boolean; moderated: boolean; moderated_at: string | null;
  moderation_reason: string | null; created_at: string; merchant: { id: number; business_name: string };
};
export type AksiModerasi = "hide" | "unhide" | "takedown" | "restore";

// F20 be/src/services/admin-keuangan.service.ts
export type AngkaKeuangan = {
  orders: number; subtotal: number; discount_merchant: number; discount_platform: number; service_fee: number; total: number;
  merchant_net: number; platform_net: number;
};
export type RekapKeuangan = { rows: (AngkaKeuangan & { merchant_id: number; business_name: string })[]; totals: AngkaKeuangan };

// Fase 1 kelola admin
export type AkunAdmin = {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  admin_level: "super" | "ops" | "support" | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  last_login_at: string | null;
};
export type AdminDenganSandi = { admin: AkunAdmin; temp_password: string };

// Tiket bantuan (kontrak tiket-kontrak.md, bagian Admin): GET/POST /api/v1/admin/tickets…
export type KategoriTiket = "akun" | "pembayaran" | "pesanan" | "penjual" | "aplikasi" | "lainnya";
/** open = menunggu admin, answered = admin sudah membalas (menunggu pembeli), closed = ditutup. */
export type StatusTiket = "open" | "answered" | "closed";
export type PengirimTiket = "customer" | "admin";

export type TiketRingkas = {
  code: string; category: KategoriTiket; subject: string; status: StatusTiket; order_code: string | null;
  created_at: string; last_message_at: string; last_message_preview: string; last_sender_role: PengirimTiket;
  customer: { id: number; full_name: string; phone: string };
};
export type MetaTiket = MetaHalaman & { counts: Record<StatusTiket, number> };

/** `sender_name`: nama admin asli atau nama pembeli. */
export type PesanTiket = { id: number; sender_role: PengirimTiket; sender_name: string | null; body: string; created_at: string };
export type DetailTiket = Omit<TiketRingkas, "last_message_preview" | "customer"> & {
  closed_at: string | null;
  closed_by: PengirimTiket | null;
  customer: { id: number; full_name: string; phone: string; email: string | null };
  order: { code: string; status: StatusPesananAdmin; total: number; merchant_name: string; created_at: string } | null;
  messages: PesanTiket[];
};
