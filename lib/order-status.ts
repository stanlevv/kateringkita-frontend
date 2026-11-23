// Satu-satunya sumber label, warna, ikon, dan tombol untuk setiap status pesanan, serta aturan perpindahan status.
// Dipakai kartu antrean dashboard, detail pesanan, dan server action pesanan.

import type { LucideIcon } from "lucide-react";
import { Ban, CheckCircle2, ChefHat, Clock, Hourglass, PackageCheck, ThumbsUp, TimerOff } from "lucide-react";
import type { MerchantOrder } from "@/types/order";

/**
 * Status pesanan untuk tampilan. "holding" dipecah dua: menunggu konfirmasi penjual atau menunggu pembayaran online.
 */
export type DisplayStatus =
  "menunggu-konfirmasi" | "menunggu-bayar" | "confirmed" | "cooking" | "ready" | "completed" | "cancelled" | "expired";
/** Aksi penjual yang mengubah status pesanan. */
export type OrderAction = "confirm" | "cook" | "ready" | "complete" | "reject";
/** Aksi tambahan di kartu pesanan (tolak, chat WhatsApp, lihat slip). */
export type SecondaryAction = "reject" | "chat-wa" | "lihat-slip";
/** Nada warna label status. */
export type Tone = "warning" | "info" | "success" | "neutral" | "danger";

/** Cara menampilkan satu status: label, warna, ikon, tombol utama (bila ada), dan tombol tambahan. */
export type StatusView = {
  label: string;
  tone: Tone;
  icon: LucideIcon;
  primary?: OrderAction;
  primaryLabel?: string;
  /** Keterangan pengganti tombol utama saat penjual tidak perlu bertindak. */
  hint?: string;
  secondary: SecondaryAction[];
};

/** Tabel tampilan untuk setiap status pesanan. */
export const statusView: Record<DisplayStatus, StatusView> = {
  "menunggu-konfirmasi": {
    label: "Menunggu konfirmasi",
    tone: "warning",
    icon: Hourglass,
    primary: "confirm",
    primaryLabel: "Konfirmasi",
    secondary: ["reject", "chat-wa"],
  },
  // Pembayaran VA/online dikonfirmasi Midtrans; pesanan diterima otomatis begitu lunas, penjual tidak perlu memeriksa manual
  "menunggu-bayar": {
    label: "Menunggu pembayaran",
    tone: "warning",
    icon: Clock,
    hint: "Diterima otomatis setelah lunas",
    secondary: ["chat-wa"],
  },
  confirmed: {
    label: "Dikonfirmasi",
    tone: "info",
    icon: ThumbsUp,
    primary: "cook",
    primaryLabel: "Mulai masak",
    secondary: ["reject", "chat-wa"],
  },
  cooking: {
    label: "Dimasak",
    tone: "info",
    icon: ChefHat,
    primary: "ready",
    primaryLabel: "Siap diambil",
    secondary: ["chat-wa"],
  },
  ready: {
    label: "Siap diambil",
    tone: "success",
    icon: PackageCheck,
    primary: "complete",
    primaryLabel: "Selesai",
    secondary: ["chat-wa"],
  },
  completed: { label: "Selesai", tone: "neutral", icon: CheckCircle2, secondary: ["lihat-slip"] },
  cancelled: { label: "Dibatalkan", tone: "danger", icon: Ban, secondary: ["lihat-slip"] },
  expired: { label: "Kadaluarsa", tone: "danger", icon: TimerOff, secondary: ["lihat-slip"] },
};

/**
 * Teks untuk tiap aksi: tulisan tombol saat sedang diproses, akhir pesan toast sukses ("Pesanan KK-… dikonfirmasi"), dan pesan toast gagal.
 */
export const actionTexts: Record<OrderAction, { pending: string; success: string; failure: string }> = {
  confirm: { pending: "Mengonfirmasi…", success: "dikonfirmasi", failure: "Gagal mengonfirmasi. Coba lagi." },
  cook: { pending: "Memulai masak…", success: "mulai dimasak", failure: "Gagal memulai masak. Coba lagi." },
  ready: { pending: "Menandai siap…", success: "siap diambil", failure: "Gagal menandai siap. Coba lagi." },
  complete: { pending: "Menyelesaikan…", success: "selesai", failure: "Gagal menyelesaikan. Coba lagi." },
  reject: { pending: "Menolak…", success: "ditolak", failure: "Gagal menolak. Coba lagi." },
};

type StatusFields = Pick<MerchantOrder, "status" | "payment_method" | "payment_status">;

/**
 * Menentukan status tampilan sebuah pesanan.
 * Pesanan "holding" yang dibayar online dan belum lunas menjadi "menunggu-bayar";
 * pembayaran online dikonfirmasi otomatis oleh Midtrans, bukan oleh penjual.
 * @param order pesanan (cukup status dan data pembayaran)
 */
export function displayStatus(order: StatusFields): DisplayStatus {
  if (order.status === "holding") {
    return order.payment_method !== "cod" && order.payment_status !== "paid" ? "menunggu-bayar" : "menunggu-konfirmasi";
  }
  return order.status;
}

// Pesanan dari meja diantar ke meja; "Siap diambil" hanya untuk pesanan yang diambil di titik temu.
const READY_FOR_TABLE = "Siap diantar";
type WithTable = Partial<Pick<MerchantOrder, "table">>;

/**
 * Mengambil tampilan status untuk satu pesanan. Pesanan dari meja memakai label "Siap diantar" alih-alih "Siap diambil".
 * @param order pesanan (status, pembayaran, dan meja bila ada)
 */
export function orderStatusView(order: StatusFields & WithTable): StatusView {
  const view = statusView[displayStatus(order)];
  if (!order.table) return view;
  return {
    ...view,
    label: view === statusView.ready ? READY_FOR_TABLE : view.label,
    primaryLabel: view.primary === "ready" ? READY_FOR_TABLE : view.primaryLabel,
  };
}

/**
 * Akhir pesan toast setelah aksi berhasil, mis. "siap diantar" untuk pesanan meja.
 * @param action aksi yang berhasil
 * @param order pesanan (cukup data meja)
 */
export const successText = (action: OrderAction, order: WithTable) =>
  action === "ready" && order.table ? "siap diantar" : actionTexts[action].success;

/**
 * Label tahap "siap" di riwayat status: "Siap diantar" untuk pesanan meja, "Siap diambil" untuk titik temu.
 * @param order pesanan (cukup data meja)
 */
export const readyStepLabel = (order: WithTable) => (order.table ? READY_FOR_TABLE : "Siap diambil");

const TRANSITIONS: Record<
  OrderAction,
  { from: MerchantOrder["status"][]; to: MerchantOrder["status"]; stamp: keyof MerchantOrder }
> = {
  confirm: { from: ["holding"], to: "confirmed", stamp: "confirmed_at" },
  cook: { from: ["confirmed"], to: "cooking", stamp: "cooking_at" },
  ready: { from: ["cooking"], to: "ready", stamp: "ready_at" },
  complete: { from: ["ready"], to: "completed", stamp: "completed_at" },
  reject: { from: ["holding", "confirmed"], to: "cancelled", stamp: "cancelled_at" },
};

/**
 * Menghitung pesanan setelah aksi dijalankan, tanpa mengubah data asli (fungsi murni).
 * @param order pesanan sekarang
 * @param action aksi penjual
 * @returns pesanan dengan status baru, atau `{ error: "CONFLICT" }` bila aksi tidak boleh untuk status ini (sama seperti jawaban 409 dari backend)
 */
export function nextStatus(order: MerchantOrder, action: OrderAction): MerchantOrder | { error: "CONFLICT" } {
  const transition = TRANSITIONS[action];
  if (!transition.from.includes(order.status)) return { error: "CONFLICT" };
  if (action === "confirm" && displayStatus(order) === "menunggu-bayar") return { error: "CONFLICT" };
  const now = new Date().toISOString();
  const next = { ...order, status: transition.to, updated_at: now, [transition.stamp]: now } as MerchantOrder;
  if (action === "reject") next.cancelled_by = "merchant";
  next.hold_until = null;
  next.seconds_left = null;
  return next;
}
