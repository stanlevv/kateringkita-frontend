import { CheckCircle2, Clock, EyeOff, XCircle, CalendarClock, type LucideIcon } from "lucide-react";
import type { Nada } from "@/lib/order-status";
import type { Banner } from "@/types/banner";

// Banner beranda: label status untuk penjual & admin, dan aturan isian yang sama dengan backend (banner.dto).
export function statusBanner(b: Banner, now: number): { label: string; tone: Nada; icon: LucideIcon } {
  if (b.status === "menunggu") return { label: "Menunggu persetujuan", tone: "warning", icon: Clock };
  if (b.status === "ditolak") return { label: "Ditolak", tone: "danger", icon: XCircle };
  if (b.status === "nonaktif") return { label: "Nonaktif", tone: "neutral", icon: EyeOff };
  if (Date.parse(b.ends_at) <= now) return { label: "Berakhir", tone: "neutral", icon: EyeOff };
  if (Date.parse(b.starts_at) > now) return { label: "Terjadwal", tone: "info", icon: CalendarClock };
  return { label: "Tayang", tone: "success", icon: CheckCircle2 };
}

/** Banner yang memakai jatah 1 banner aktif per toko. */
export const bannerAktif = (b: Banner, now: number) =>
  (b.status === "menunggu" || b.status === "disetujui") && Date.parse(b.ends_at) > now;

export type IsianBanner = {
  title: string;
  image_url: string;
  target: string;
  promo_id: number | null;
  starts_at: string;
  ends_at: string;
  sort_order?: number;
};

export function cekBanner(v: IsianBanner): Record<string, string> {
  const out: Record<string, string> = {};
  const t = v.title.trim();
  if (t.length < 3 || t.length > 80) out.title = "Judul 3–80 karakter.";
  if (!v.image_url) out.image_url = "Unggah gambar banner.";
  if (v.target === "promo" && !v.promo_id) out.promo_id = "Pilih voucher.";
  const a = Date.parse(v.starts_at);
  const b = Date.parse(v.ends_at);
  if (Number.isNaN(a)) out.starts_at = "Waktu mulai wajib diisi.";
  if (Number.isNaN(b)) out.ends_at = "Waktu selesai wajib diisi.";
  else if (!Number.isNaN(a) && b <= a) out.ends_at = "Waktu selesai harus setelah waktu mulai.";
  return out;
}
