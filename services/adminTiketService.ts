import { CheckCircle2, Hourglass, MessageSquareReply, type LucideIcon } from "lucide-react";
import { statusView, type Nada, type TampilanStatus } from "@/lib/order-status";
import type { KategoriTiket, PengirimTiket, StatusPesananAdmin, StatusTiket } from "@/types/admin";

// Tiket bantuan: label & aturan tampilan bersama untuk halaman admin dan aksi servernya.
export const LIMIT_TIKET = 20;

/** Kode tiket di URL (`TK-YYYYMMDD-XXXX`, maks 20 karakter). Dicek longgar; backend tetap penentu ada tidaknya. */
export const kodeTiketValid = (code: unknown): code is string => typeof code === "string" && /^[A-Za-z0-9-]{1,20}$/.test(code);

export const BATAS_BALASAN = 2000;

export const KATEGORI_TIKET: Record<KategoriTiket, string> = {
  akun: "Akun",
  pembayaran: "Pembayaran",
  pesanan: "Pesanan",
  penjual: "Penjual",
  aplikasi: "Aplikasi",
  lainnya: "Lainnya",
};
export const labelKategori = (k: string) => KATEGORI_TIKET[k as KategoriTiket] ?? k;

export const STATUS_TIKET: Record<StatusTiket, { label: string; tone: Nada; icon: LucideIcon }> = {
  open: { label: "Menunggu", tone: "warning", icon: Hourglass },
  answered: { label: "Dibalas", tone: "info", icon: MessageSquareReply },
  closed: { label: "Ditutup", tone: "neutral", icon: CheckCircle2 },
};

/** Tab daftar: `open` bawaan (paling lama menunggu di atas), `semua` = tanpa filter status. */
export type TabTiket = StatusTiket | "semua";
export const TAB_TIKET: { id: TabTiket; label: string }[] = [
  { id: "open", label: "Menunggu" },
  { id: "answered", label: "Dibalas" },
  { id: "closed", label: "Ditutup" },
  { id: "semua", label: "Semua" },
];
export const tabTiket = (v: unknown): TabTiket => TAB_TIKET.find((t) => t.id === v)?.id ?? "open";

export const LABEL_PENGIRIM: Record<PengirimTiket, string> = { customer: "Pembeli", admin: "Admin" };

/**
 * Status pesanan terkait. `holding` di sini bisa berarti menunggu konfirmasi penjual atau menunggu pembayaran
 * (data pembayaran tidak ikut dikirim), jadi labelnya netral.
 */
const PESANAN: Partial<Record<StatusPesananAdmin, TampilanStatus>> = {
  confirmed: "confirmed", cooking: "cooking", ready: "ready", completed: "completed", cancelled: "cancelled", expired: "expired",
};
export function statusPesananTiket(s: string): { label: string; tone: Nada; icon: LucideIcon } {
  if (s === "holding") return { label: "Belum dikonfirmasi", tone: "warning", icon: Hourglass };
  const t = PESANAN[s as StatusPesananAdmin];
  return t ? statusView[t] : { label: s, tone: "neutral", icon: Hourglass };
}
