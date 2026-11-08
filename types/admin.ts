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
