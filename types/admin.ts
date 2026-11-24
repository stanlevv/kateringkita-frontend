// Bentuk data yang dikirim backend untuk panel admin (/api/v1/admin/...).
// Nama properti mengikuti JSON dari backend, jadi sengaja tidak diterjemahkan.
// Dipakai services/admin-*.service.ts, server action admin, dan halaman di app/(admin).
import type { ChatMessage } from "@/types/order-chat";

/** Status pesanan seperti yang dilaporkan backend di panel admin. */
export type AdminOrderStatus = "holding" | "confirmed" | "cooking" | "ready" | "completed" | "cancelled" | "expired";

/** Satu catatan jejak tindakan admin (siapa mengubah apa, data sebelum dan sesudahnya). */
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

/**
 * Ringkasan halaman depan panel admin: jumlah pesanan hari ini per status, omzet, dan jumlah penjual per status verifikasi.
 */
export type AdminSummary = {
  orders_today: Record<AdminOrderStatus, number>;
  revenue_today: number;
  merchants: { pending: number; needs_fix: number; verified: number; suspended: number; open_now: number };
  holding_expiring_soon: number;
  recent_logs: AuditLog[];
};

/**
 * Keterangan halaman untuk daftar yang dipecah per halaman: nomor halaman, jumlah per halaman, dan total data.
 */
export type PageMeta = { page: number; limit: number; total: number };

/** Tahap verifikasi penjual: menunggu, perlu perbaikan, terverifikasi, atau ditangguhkan. */
export type VerificationStatus = "pending" | "needs_fix" | "verified" | "suspended";
/**
 * Daftar syarat toko siap tampil (nomor WA valid, alamat, titik temu, menu aktif, foto, jam buka); true = syarat terpenuhi.
 */
export type Checklist = Record<
  "wa_valid" | "address" | "pickup_point" | "active_menu" | "menu_with_photo" | "opening_hours",
  boolean
>;
/**
 * Tindakan admin terhadap penjual (verifikasi, minta perbaikan, tangguhkan, aktifkan lagi, tutup dapur hari ini).
 */
export type MerchantAction = "verify" | "request-fix" | "suspend" | "reactivate" | "close-today";

/** Satu baris di daftar penjual pada panel admin. */
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
/** Satu penjual di antrean verifikasi, lengkap dengan catatan admin dan checklist kesiapan toko. */
export type VerificationQueueItem = Omit<MerchantSummary, "is_open" | "menu_count"> & {
  verification_note: string | null;
  checklist: Checklist;
  updated_after_note: boolean;
};
/** Data lengkap satu penjual untuk halaman detail di panel admin. */
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
  description?: string | null;
  owner: { full_name: string; phone: string; email: string | null; is_active: boolean };
  pickup_points: { id: number; name: string }[];
  checklist: Checklist;
  recent_logs: AuditLog[];
};

/** Jenis data master yang dikelola admin: kategori menu, titik temu, dan jenis usaha. */
export type MasterKind = "categories" | "pickup-points" | "merchant-types";
/** Satu baris data master. `icon` hanya ada di kategori, `description` hanya di titik temu. */
export type MasterItem = {
  id: number;
  name: string;
  is_active: boolean;
  icon?: string | null;
  description?: string | null;
  sort_order?: number;
};

/** Ulasan pembeli yang bisa disembunyikan admin (moderasi). */
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
/** Menu penjual yang bisa diturunkan admin bila melanggar aturan (moderasi). */
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
/** Tindakan moderasi: sembunyikan, tampilkan lagi, turunkan, atau pulihkan. */
export type ModerationAction = "hide" | "unhide" | "takedown" | "restore";

/**
 * Angka keuangan dalam rupiah: jumlah pesanan, subtotal, diskon, biaya layanan, dan bagian penjual serta platform.
 */
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
/** Rekap keuangan per toko ditambah baris total, untuk halaman keuangan admin dan unduhan CSV. */
export type FinanceSummary = {
  rows: (FinanceFigures & { merchant_id: number; business_name: string })[];
  totals: FinanceFigures;
};

/** Akun admin seperti yang tampil di halaman kelola admin. */
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
/**
 * Hasil membuat admin baru atau reset sandi: akun admin dan sandi sementara yang hanya ditampilkan sekali.
 */
export type AdminWithPassword = { admin: AdminAccount; temp_password: string };

/** Kategori tiket bantuan yang dipilih pembeli. */
export type TicketCategory = "akun" | "pembayaran" | "pesanan" | "penjual" | "aplikasi" | "lainnya";
/**
 * Status tiket: `open` = menunggu admin, `answered` = admin sudah membalas (menunggu pembeli), `closed` = ditutup.
 */
export type TicketStatus = "open" | "answered" | "closed";
/** Pengirim pesan di tiket: pembeli atau admin. */
export type TicketSender = "customer" | "admin";

/** Satu baris di daftar tiket bantuan. */
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
/** Keterangan halaman daftar tiket ditambah jumlah tiket per status (untuk angka di tab). */
export type TicketMeta = PageMeta & { counts: Record<TicketStatus, number> };

/** Satu pesan di percakapan tiket. `sender_name` berisi nama admin asli atau nama pembeli. */
export type TicketMessage = {
  id: number;
  sender_role: TicketSender;
  sender_name: string | null;
  body: string;
  created_at: string;
};
/** Data lengkap satu tiket: percakapan, data pembeli, dan pesanan terkait bila ada. */
export type TicketDetail = Omit<TicketSummary, "last_message_preview" | "customer"> & {
  closed_at: string | null;
  closed_by: TicketSender | null;
  customer: { id: number; full_name: string; phone: string; email: string | null };
  order: { code: string; status: AdminOrderStatus; total: number; merchant_name: string; created_at: string } | null;
  messages: TicketMessage[];
};

/**
 * Satu laporan chat pesanan di daftar admin. `reporter_role` = pihak yang melapor; `reporter_name` null bila akun
 * pelapor sudah dihapus.
 */
export type ChatReportSummary = {
  id: number;
  order_code: string;
  reporter_role: "customer" | "merchant";
  reporter_name: string | null;
  reason: string;
  created_at: string;
};

/** Detail laporan chat: ringkasan ditambah seluruh riwayat pesan chat pesanan itu (urut id naik). */
export type ChatReportDetail = ChatReportSummary & { messages: ChatMessage[] };

/** Satu baris daftar pembeli di panel admin. */
export type CustomerSummary = {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  is_active: boolean;
  order_count: number;
  last_order_at: string | null;
  created_at: string;
};

/** Detail satu pembeli di panel admin, dengan ringkasan pesanan (`spent` = total belanja pesanan selesai, Rupiah). */
export type CustomerDetail = Omit<CustomerSummary, "order_count" | "last_order_at"> & {
  email_verified: boolean;
  orders: { total: number; completed: number; cancelled: number; spent: number; last_order_at: string | null };
};
