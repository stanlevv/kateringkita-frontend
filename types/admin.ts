// Cermin respons backend /api/v1/admin (be/src/admin/summary.ts, audit.ts).
export type AdminOrderStatus = "holding" | "confirmed" | "cooking" | "ready" | "completed" | "cancelled" | "expired";

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

export type AdminSummary = {
  orders_today: Record<AdminOrderStatus, number>;
  revenue_today: number;
  merchants: { pending: number; needs_fix: number; verified: number; suspended: number; open_now: number };
  holding_expiring_soon: number;
  recent_logs: AuditLog[];
};

export type PageMeta = { page: number; limit: number; total: number };

// be/src/admin/merchants.ts
export type VerificationStatus = "pending" | "needs_fix" | "verified" | "suspended";
export type Checklist = Record<
  "wa_valid" | "address" | "pickup_point" | "active_menu" | "menu_with_photo" | "opening_hours",
  boolean
>;
export type MerchantAction = "verify" | "request-fix" | "suspend" | "reactivate" | "close-today";

export type MerchantSummary = {
  id: number;
  business_name: string;
  owner_name: string;
  wa_number: string;
  verification_status: VerificationStatus;
  is_open: boolean;
  menu_count: number;
  created_at: string;
};
export type VerificationQueueItem = Omit<MerchantSummary, "is_open" | "menu_count"> & {
  verification_note: string | null;
  checklist: Checklist;
  updated_after_note: boolean;
};
export type AdminMerchantDetail = {
  id: number;
  business_name: string;
  address: string;
  wa_number: string;
  open_time: string;
  close_time: string;
  verification_status: VerificationStatus;
  verification_note: string | null;
  suspended_reason: string | null;
  is_open: boolean;
  created_at: string;
  merchant_type_name: string;
  menu_count: number;
  owner: { full_name: string; phone: string; email: string | null };
  pickup_points: { id: number; name: string }[];
  checklist: Checklist;
  recent_logs: AuditLog[];
};

// be/src/admin/master.ts
export type MasterKind = "categories" | "pickup-points" | "merchant-types";
export type MasterItem = {
  id: number;
  name: string;
  is_active: boolean;
  icon?: string | null;
  description?: string | null;
  sort_order?: number;
};

// F19 be/src/services/admin-moderasi.service.ts
export type ModerationReview = {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  hidden: boolean;
  hidden_at: string | null;
  hidden_reason: string | null;
  menu: { id: number; name: string };
  merchant: { id: number; business_name: string };
  customer_name: string;
  order_code: string;
};
export type ModerationMenu = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  gallery?: string[];
  is_active: boolean;
  moderated: boolean;
  moderated_at: string | null;
  moderation_reason: string | null;
  created_at: string;
  merchant: { id: number; business_name: string };
};
export type ModerationAction = "hide" | "unhide" | "takedown" | "restore";

// F20 be/src/services/admin-keuangan.service.ts
export type FinanceFigures = {
  orders: number;
  subtotal: number;
  discount_merchant: number;
  discount_platform: number;
  service_fee: number;
  total: number;
  merchant_net: number;
  platform_net: number;
};
export type FinanceSummary = {
  rows: (FinanceFigures & { merchant_id: number; business_name: string })[];
  totals: FinanceFigures;
};

// Fase 1 kelola admin
export type AdminAccount = {
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
export type AdminWithPassword = { admin: AdminAccount; temp_password: string };

// Tiket bantuan (kontrak tiket-kontrak.md, bagian Admin): GET/POST /api/v1/admin/tickets…
export type TicketCategory = "akun" | "pembayaran" | "pesanan" | "penjual" | "aplikasi" | "lainnya";
/** open = menunggu admin, answered = admin sudah membalas (menunggu pembeli), closed = ditutup. */
export type TicketStatus = "open" | "answered" | "closed";
export type TicketSender = "customer" | "admin";

export type TicketSummary = {
  code: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  order_code: string | null;
  created_at: string;
  last_message_at: string;
  last_message_preview: string;
  last_sender_role: TicketSender;
  customer: { id: number; full_name: string; phone: string };
};
export type TicketMeta = PageMeta & { counts: Record<TicketStatus, number> };

/** `sender_name`: nama admin asli atau nama pembeli. */
export type TicketMessage = {
  id: number;
  sender_role: TicketSender;
  sender_name: string | null;
  body: string;
  created_at: string;
};
export type TicketDetail = Omit<TicketSummary, "last_message_preview" | "customer"> & {
  closed_at: string | null;
  closed_by: TicketSender | null;
  customer: { id: number; full_name: string; phone: string; email: string | null };
  order: { code: string; status: AdminOrderStatus; total: number; merchant_name: string; created_at: string } | null;
  messages: TicketMessage[];
};
