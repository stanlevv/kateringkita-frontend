import { CheckCircle2, Hourglass, MessageSquareReply, type LucideIcon } from "lucide-react";
import { statusView, type Tone, type DisplayStatus } from "@/lib/order-status";
import type { TicketCategory, TicketSender, AdminOrderStatus, TicketStatus } from "@/types/admin";

// Tiket bantuan: label & aturan tampilan bersama untuk halaman admin dan aksi servernya.
export const LIMIT_TICKETS = 20;

/** Kode tiket di URL (`TK-YYYYMMDD-XXXX`, maks 20 karakter). Dicek longgar; backend tetap penentu ada tidaknya. */
export const isValidTicketCode = (code: unknown): code is string =>
  typeof code === "string" && /^[A-Za-z0-9-]{1,20}$/.test(code);

export const MAX_REPLY_LENGTH = 2000;

export const TICKET_CATEGORIES: Record<TicketCategory, string> = {
  akun: "Akun",
  pembayaran: "Pembayaran",
  pesanan: "Pesanan",
  penjual: "Penjual",
  aplikasi: "Aplikasi",
  lainnya: "Lainnya",
};
export const categoryLabel = (category: string) => TICKET_CATEGORIES[category as TicketCategory] ?? category;

export const TICKET_STATUSES: Record<TicketStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  open: { label: "Menunggu", tone: "warning", icon: Hourglass },
  answered: { label: "Dibalas", tone: "info", icon: MessageSquareReply },
  closed: { label: "Ditutup", tone: "neutral", icon: CheckCircle2 },
};

/** Tab daftar: `open` bawaan (paling lama menunggu di atas), `semua` = tanpa filter status. */
export type TicketTab = TicketStatus | "semua";
export const TICKET_TABS: { id: TicketTab; label: string }[] = [
  { id: "open", label: "Menunggu" },
  { id: "answered", label: "Dibalas" },
  { id: "closed", label: "Ditutup" },
  { id: "semua", label: "Semua" },
];
export const parseTicketTab = (value: unknown): TicketTab => TICKET_TABS.find((tab) => tab.id === value)?.id ?? "open";

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
export function ticketOrderStatus(status: string): { label: string; tone: Tone; icon: LucideIcon } {
  if (status === "holding") return { label: "Belum dikonfirmasi", tone: "warning", icon: Hourglass };
  const displayStatus = ORDER_DISPLAY_STATUS[status as AdminOrderStatus];
  return displayStatus ? statusView[displayStatus] : { label: status, tone: "neutral", icon: Hourglass };
}
