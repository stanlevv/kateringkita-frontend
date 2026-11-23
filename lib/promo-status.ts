// Satu-satunya sumber label dan ikon status promo/voucher, serta teks jenis potongannya.

import type { LucideIcon } from "lucide-react";
import { CalendarClock, CalendarX, CircleCheck, PackageX, PowerOff } from "lucide-react";
import { formatRupiah } from "./format";
import type { Tone } from "./order-status";
import type { Promo } from "@/types/promo";

/** Status voucher pada suatu waktu. */
export type PromoStatus = "nonaktif" | "terjadwal" | "berakhir" | "kuota-habis" | "berjalan";

/** Label, warna, dan ikon untuk setiap status voucher. */
export const PROMO_STATUS: Record<PromoStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  nonaktif: { label: "Nonaktif", tone: "neutral", icon: PowerOff },
  terjadwal: { label: "Terjadwal", tone: "info", icon: CalendarClock },
  berakhir: { label: "Berakhir", tone: "neutral", icon: CalendarX },
  "kuota-habis": { label: "Kuota habis", tone: "warning", icon: PackageX },
  berjalan: { label: "Aktif", tone: "success", icon: CircleCheck },
};

/**
 * Menentukan status voucher: nonaktif, terjadwal, berakhir, kuota habis, atau berjalan.
 * @param promo data voucher
 * @param now waktu acuan dalam milidetik (bawaan: sekarang)
 */
export function promoStatus(promo: Promo, now: number = Date.now()): PromoStatus {
  if (!promo.is_active) return "nonaktif";
  if (now < Date.parse(promo.starts_at)) return "terjadwal";
  if (now > Date.parse(promo.ends_at)) return "berakhir";
  if (promo.quota !== null && promo.used_count >= promo.quota) return "kuota-habis";
  return "berjalan";
}

/**
 * Menulis jenis potongan voucher, mis. "Diskon 10% maks Rp 10.000", "Potongan Rp 5.000", atau "Gratis biaya layanan".
 * @param promo data voucher
 */
export function describePromoType(promo: Promo): string {
  if (promo.type === "percent")
    return `Diskon ${promo.value}%${promo.max_discount ? ` maks ${formatRupiah(promo.max_discount)}` : ""}`;
  if (promo.type === "fixed") return `Potongan ${formatRupiah(promo.value)}`;
  return "Gratis biaya layanan";
}
