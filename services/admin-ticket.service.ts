// Label dan aturan tampilan tiket bantuan, dipakai halaman admin dan server action tiket.
// Tidak memanggil backend: hanya aturan dan label bersama untuk halaman admin dan actions-nya.

import { CheckCircle2, Hourglass, MessageSquareReply, type LucideIcon } from "lucide-react";
import { statusView, type Tone, type DisplayStatus } from "@/lib/order-status";
import type { TicketCategory, TicketSender, AdminOrderStatus, TicketStatus } from "@/types/admin";

/** Jumlah tiket per halaman. */
export const LIMIT_TICKETS = 20;

/**
 * Mengecek bentuk kode tiket di URL (mis. `TK-YYYYMMDD-XXXX`, paling panjang 20 karakter).
 * Pemeriksaan longgar; backend tetap penentu tiket itu ada atau tidak.
 * @param code nilai dari URL
 * @returns true bila bentuknya seperti kode tiket
 */
export const isValidTicketCode = (code: unknown): code is string =>
  typeof code === "string" && /^[A-Za-z0-9-]{1,20}$/.test(code);

/** Panjang balasan admin paling banyak (karakter). */
export const MAX_REPLY_LENGTH = 2000;

/** Label tiap kategori tiket. */
export const TICKET_CATEGORIES: Record<TicketCategory, string> = {
  akun: "Akun",
  pembayaran: "Pembayaran",
  pesanan: "Pesanan",
  penjual: "Penjual",
  aplikasi: "Aplikasi",
  lainnya: "Lainnya",
};
/**
 * Label kategori tiket; kategori tidak dikenal ditampilkan apa adanya.
 * @param category kode kategori
 * @returns label kategori
 */
export const categoryLabel = (category: string) => TICKET_CATEGORIES[category as TicketCategory] ?? category;

/** Label, warna, dan ikon tiap status tiket. */
export const TICKET_STATUSES: Record<TicketStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  open: { label: "Menunggu", tone: "warning", icon: Hourglass },
  answered: { label: "Dibalas", tone: "info", icon: MessageSquareReply },
  closed: { label: "Ditutup", tone: "neutral", icon: CheckCircle2 },
};

/** Tab daftar tiket: per status, atau `semua` (tanpa penyaring status). */
export type TicketTab = TicketStatus | "semua";
/** Urutan tab daftar tiket. Tab bawaan `open` menampilkan yang paling lama menunggu di atas. */
export const TICKET_TABS: { id: TicketTab; label: string }[] = [
  { id: "open", label: "Menunggu" },
  { id: "answered", label: "Dibalas" },
  { id: "closed", label: "Ditutup" },
  { id: "semua", label: "Semua" },
];
/**
 * Membaca tab dari URL; nilai tidak dikenal menjadi "open".
 * @param value nilai mentah dari searchParams
 * @returns id tab yang sah
 */
export const parseTicketTab = (value: unknown): TicketTab => TICKET_TABS.find((tab) => tab.id === value)?.id ?? "open";

/** Label pengirim pesan tiket. */
export const SENDER_LABELS: Record<TicketSender, string> = { customer: "Pembeli", admin: "Admin" };

/**
 * Status pesanan terkait. `holding` di sini bisa berarti menunggu konfirmasi penjual atau menunggu pembayaran
 * (data pembayaran tidak ikut dikirim), jadi labelnya netral.
 */
const ORDER_DISPLAY_STATUS: Partial<Record<AdminOrderStatus, DisplayStatus>> = {
  confirmed: "confirmed",
  cooking: "cooking",
  ready: "ready",
  completed: "completed",
  cancelled: "cancelled",
  expired: "expired",
};
/**
 * Label status pesanan yang terkait dengan tiket.
 * "holding" diberi label netral karena bisa berarti menunggu konfirmasi atau menunggu pembayaran (data pembayaran tidak ikut dikirim).
 * @param status status pesanan dari backend
 * @returns label, warna, dan ikon
 */
export function ticketOrderStatus(status: string): { label: string; tone: Tone; icon: LucideIcon } {
  if (status === "holding") return { label: "Belum dikonfirmasi", tone: "warning", icon: Hourglass };
  const displayStatus = ORDER_DISPLAY_STATUS[status as AdminOrderStatus];
  return displayStatus ? statusView[displayStatus] : { label: status, tone: "neutral", icon: Hourglass };
}
