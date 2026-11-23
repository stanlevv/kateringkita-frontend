import { CheckCircle2, Clock, EyeOff, XCircle, CalendarClock, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/order-status";
import type { Banner } from "@/types/banner";

// Banner beranda: label status untuk penjual & admin, dan aturan isian yang sama dengan backend (banner.dto).
export function bannerStatus(banner: Banner, now: number): { label: string; tone: Tone; icon: LucideIcon } {
  if (banner.status === "menunggu") return { label: "Menunggu persetujuan", tone: "warning", icon: Clock };
  if (banner.status === "ditolak") return { label: "Ditolak", tone: "danger", icon: XCircle };
  if (banner.status === "nonaktif") return { label: "Nonaktif", tone: "neutral", icon: EyeOff };
  if (Date.parse(banner.ends_at) <= now) return { label: "Berakhir", tone: "neutral", icon: EyeOff };
  if (Date.parse(banner.starts_at) > now) return { label: "Terjadwal", tone: "info", icon: CalendarClock };
  return { label: "Tayang", tone: "success", icon: CheckCircle2 };
}

/** Banner yang memakai jatah 1 banner aktif per toko. */
export const isBannerActive = (banner: Banner, now: number) =>
  (banner.status === "menunggu" || banner.status === "disetujui") && Date.parse(banner.ends_at) > now;

export type BannerInput = {
  title: string;
  image_url: string;
  target: string;
  promo_id: number | null;
  starts_at: string;
  ends_at: string;
  sort_order?: number;
};

export function validateBanner(input: BannerInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = input.title.trim();
  if (title.length < 3 || title.length > 80) errors.title = "Judul 3–80 karakter.";
  if (!input.image_url) errors.image_url = "Unggah gambar banner.";
  if (input.target === "promo" && !input.promo_id) errors.promo_id = "Pilih voucher.";
  const startsAt = Date.parse(input.starts_at);
  const endsAt = Date.parse(input.ends_at);
  if (Number.isNaN(startsAt)) errors.starts_at = "Waktu mulai wajib diisi.";
  if (Number.isNaN(endsAt)) errors.ends_at = "Waktu selesai wajib diisi.";
  else if (!Number.isNaN(startsAt) && endsAt <= startsAt) errors.ends_at = "Waktu selesai harus setelah waktu mulai.";
  return errors;
}
