import type { LucideIcon } from "lucide-react";
import { Ban, CheckCircle2, ChefHat, Clock, Hourglass, PackageCheck, ThumbsUp, TimerOff } from "lucide-react";
import type { MerchantOrder } from "@/types/order";

export type TampilanStatus =
  | "menunggu-konfirmasi"
  | "menunggu-bayar"
  | "confirmed"
  | "cooking"
  | "ready"
  | "completed"
  | "cancelled"
  | "expired";
export type AksiPesanan = "confirm" | "pay" | "cook" | "ready" | "complete" | "reject";
export type AksiLain = "reject" | "chat-wa" | "lihat-slip";
export type Nada = "warning" | "info" | "success" | "neutral" | "danger";

export type StatusView = {
  label: string;
  tone: Nada;
  icon: LucideIcon;
  primary?: AksiPesanan;
  primaryLabel?: string;
  secondary: AksiLain[];
};

// Tabel brief v3 §4 — satu-satunya sumber label/warna/ikon/aksi status pesanan.
export const statusView: Record<TampilanStatus, StatusView> = {
  "menunggu-konfirmasi": { label: "Menunggu konfirmasi", tone: "warning", icon: Hourglass, primary: "confirm", primaryLabel: "Konfirmasi", secondary: ["reject", "chat-wa"] },
  // F10: QRIS dicek manual di aplikasi bank/e-wallet penjual, lalu diverifikasi sekaligus diterima
  "menunggu-bayar": { label: "Menunggu pembayaran", tone: "warning", icon: Clock, primary: "pay", primaryLabel: "Verifikasi bayar & terima", secondary: ["chat-wa"] },
  confirmed: { label: "Dikonfirmasi", tone: "info", icon: ThumbsUp, primary: "cook", primaryLabel: "Mulai masak", secondary: ["reject", "chat-wa"] },
  cooking: { label: "Dimasak", tone: "info", icon: ChefHat, primary: "ready", primaryLabel: "Siap diambil", secondary: ["chat-wa"] },
  ready: { label: "Siap diambil", tone: "success", icon: PackageCheck, primary: "complete", primaryLabel: "Selesai", secondary: ["chat-wa"] },
  completed: { label: "Selesai", tone: "neutral", icon: CheckCircle2, secondary: ["lihat-slip"] },
  cancelled: { label: "Dibatalkan", tone: "danger", icon: Ban, secondary: ["lihat-slip"] },
  expired: { label: "Kadaluarsa", tone: "danger", icon: TimerOff, secondary: ["lihat-slip"] },
};

/** Teks setelah aksi: tombol saat menunggu, toast sukses ("Pesanan KK-… dikonfirmasi"), toast gagal (DB-E1). */
export const teksAksi: Record<AksiPesanan, { proses: string; sukses: string; gagal: string }> = {
  confirm: { proses: "Mengonfirmasi…", sukses: "dikonfirmasi", gagal: "Gagal mengonfirmasi. Coba lagi." },
  pay: { proses: "Memverifikasi…", sukses: "lunas dan dikonfirmasi", gagal: "Gagal memverifikasi pembayaran. Coba lagi." },
  cook: { proses: "Memulai masak…", sukses: "mulai dimasak", gagal: "Gagal memulai masak. Coba lagi." },
  ready: { proses: "Menandai siap…", sukses: "siap diambil", gagal: "Gagal menandai siap. Coba lagi." },
  complete: { proses: "Menyelesaikan…", sukses: "selesai", gagal: "Gagal menyelesaikan. Coba lagi." },
  reject: { proses: "Menolak…", sukses: "ditolak", gagal: "Gagal menolak. Coba lagi." },
};

type Kunci = Pick<MerchantOrder, "status" | "payment_method" | "payment_status">;

export function tampilanStatus(o: Kunci): TampilanStatus {
  if (o.status === "holding") {
    return o.payment_method !== "cod" && o.payment_status !== "paid" ? "menunggu-bayar" : "menunggu-konfirmasi";
  }
  return o.status;
}

const DARI: Record<AksiPesanan, { dari: MerchantOrder["status"][]; ke: MerchantOrder["status"]; stamp: keyof MerchantOrder }> = {
  confirm: { dari: ["holding"], ke: "confirmed", stamp: "confirmed_at" },
  pay: { dari: ["holding"], ke: "confirmed", stamp: "confirmed_at" },
  cook: { dari: ["confirmed"], ke: "cooking", stamp: "cooking_at" },
  ready: { dari: ["cooking"], ke: "ready", stamp: "ready_at" },
  complete: { dari: ["ready"], ke: "completed", stamp: "completed_at" },
  reject: { dari: ["holding", "confirmed"], ke: "cancelled", stamp: "cancelled_at" },
};

/** Fungsi murni: pesanan baru, atau CONFLICT bila transisi tak sah (API.md: 409). */
export function nextStatus(order: MerchantOrder, aksi: AksiPesanan): MerchantOrder | { error: "CONFLICT" } {
  const t = DARI[aksi];
  if (!t.dari.includes(order.status)) return { error: "CONFLICT" };
  if (aksi === "confirm" && tampilanStatus(order) === "menunggu-bayar") return { error: "CONFLICT" };
  if (aksi === "pay" && tampilanStatus(order) !== "menunggu-bayar") return { error: "CONFLICT" };
  const now = new Date().toISOString();
  const next = { ...order, status: t.ke, updated_at: now, [t.stamp]: now } as MerchantOrder;
  if (aksi === "reject") next.cancelled_by = "merchant";
  if (aksi === "pay") next.payment_status = "paid";
  next.hold_until = null;
  next.seconds_left = null;
  return next;
}
