// Aturan banner beranda: label status untuk penjual dan admin, serta validasi form yang sama dengan backend.

import { Archive, CheckCircle2, Clock, EyeOff, XCircle, CalendarClock, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/order-status";
import type { Banner } from "@/types/banner";

/**
 * Menentukan label, warna, dan ikon status banner pada waktu tertentu.
 * @param banner data banner
 * @param now waktu sekarang dalam milidetik
 * @returns label status (mis. "Tayang", "Terjadwal", "Diarsipkan admin"), nada warna, dan ikon
 */
export function bannerStatus(banner: Banner, now: number): { label: string; tone: Tone; icon: LucideIcon } {
  // Banner arsip tidak tayang apa pun status persetujuannya.
  if (banner.archived_at) return { label: "Diarsipkan admin", tone: "neutral", icon: Archive };
  if (banner.status === "menunggu") return { label: "Menunggu persetujuan", tone: "warning", icon: Clock };
  if (banner.status === "ditolak") return { label: "Ditolak", tone: "danger", icon: XCircle };
  if (banner.status === "nonaktif") return { label: "Nonaktif", tone: "neutral", icon: EyeOff };
  if (Date.parse(banner.ends_at) <= now) return { label: "Berakhir", tone: "neutral", icon: EyeOff };
  if (Date.parse(banner.starts_at) > now) return { label: "Terjadwal", tone: "info", icon: CalendarClock };
  return { label: "Tayang", tone: "success", icon: CheckCircle2 };
}

/**
 * Mengecek apakah banner memakai jatah satu banner aktif per toko (menunggu atau disetujui, belum berakhir, dan tidak
 * diarsipkan admin).
 * @param banner data banner
 * @param now waktu sekarang dalam milidetik
 * @returns true bila banner masih memakai jatah aktif
 */
export const isBannerActive = (banner: Banner, now: number) =>
  !banner.archived_at &&
  (banner.status === "menunggu" || banner.status === "disetujui") &&
  Date.parse(banner.ends_at) > now;

/** Isian form banner yang dikirim ke backend. */
export type BannerInput = {
  title: string;
  image_url: string;
  target: string;
  promo_id: number | null;
  starts_at: string;
  ends_at: string;
  sort_order?: number;
};

/**
 * Memeriksa isian form banner dengan aturan yang sama seperti backend.
 * @param input isian form
 * @returns pesan galat per field; objek kosong berarti isian valid
 */
export function validateBanner(input: BannerInput): Record<string, string> {
  const errors: Record<string, string> = {};
  // 1. Judul 3–80 karakter, gambar wajib, dan voucher wajib bila tujuannya promo.
  const title = input.title.trim();
  if (title.length < 3 || title.length > 80) errors.title = "Judul 3–80 karakter.";
  if (!input.image_url) errors.image_url = "Unggah gambar banner.";
  if (input.target === "promo" && !input.promo_id) errors.promo_id = "Pilih voucher.";
  // 2. Waktu mulai dan selesai wajib diisi, dan selesai harus setelah mulai.
  const startsAt = Date.parse(input.starts_at);
  const endsAt = Date.parse(input.ends_at);
  if (Number.isNaN(startsAt)) errors.starts_at = "Waktu mulai wajib diisi.";
  if (Number.isNaN(endsAt)) errors.ends_at = "Waktu selesai wajib diisi.";
  else if (!Number.isNaN(startsAt) && endsAt <= startsAt) errors.ends_at = "Waktu selesai harus setelah waktu mulai.";
  return errors;
}
