import type { LucideIcon } from "lucide-react";
import { CalendarClock, CalendarX, CircleCheck, PackageX, PowerOff } from "lucide-react";
import { formatRupiah } from "./format";
import type { Tone } from "./order-status";
import type { Promo } from "@/types/promo";

export type PromoStatus = "nonaktif" | "terjadwal" | "berakhir" | "kuota-habis" | "berjalan";

// PR-N1 — satu-satunya sumber label/ikon status promo.
export const PROMO_STATUS: Record<PromoStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  nonaktif: { label: "Nonaktif", tone: "neutral", icon: PowerOff },
  terjadwal: { label: "Terjadwal", tone: "info", icon: CalendarClock },
  berakhir: { label: "Berakhir", tone: "neutral", icon: CalendarX },
  "kuota-habis": { label: "Kuota habis", tone: "warning", icon: PackageX },
  berjalan: { label: "Aktif", tone: "success", icon: CircleCheck },
};

export function promoStatus(promo: Promo, now: number = Date.now()): PromoStatus {
  if (!promo.is_active) return "nonaktif";
  if (now < Date.parse(promo.starts_at)) return "terjadwal";
  if (now > Date.parse(promo.ends_at)) return "berakhir";
  if (promo.quota !== null && promo.used_count >= promo.quota) return "kuota-habis";
  return "berjalan";
}

export function describePromoType(promo: Promo): string {
  if (promo.type === "percent")
    return `Diskon ${promo.value}%${promo.max_discount ? ` maks ${formatRupiah(promo.max_discount)}` : ""}`;
  if (promo.type === "fixed") return `Potongan ${formatRupiah(promo.value)}`;
  return "Gratis biaya layanan";
}
