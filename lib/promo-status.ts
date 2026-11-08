import type { LucideIcon } from "lucide-react";
import { CalendarClock, CalendarX, CircleCheck, PackageX, PowerOff } from "lucide-react";
import { formatRupiah } from "./format";
import type { Nada } from "./order-status";
import type { Promo } from "@/types/promo";

export type StatusPromo = "nonaktif" | "terjadwal" | "berakhir" | "kuota-habis" | "berjalan";

// PR-N1 — satu-satunya sumber label/ikon status promo.
export const PROMO_STATUS: Record<StatusPromo, { label: string; tone: Nada; icon: LucideIcon }> = {
  nonaktif: { label: "Nonaktif", tone: "neutral", icon: PowerOff },
  terjadwal: { label: "Terjadwal", tone: "info", icon: CalendarClock },
  berakhir: { label: "Berakhir", tone: "neutral", icon: CalendarX },
  "kuota-habis": { label: "Kuota habis", tone: "warning", icon: PackageX },
  berjalan: { label: "Aktif", tone: "success", icon: CircleCheck },
};

export function promoStatus(p: Promo, now: number = Date.now()): StatusPromo {
  if (!p.is_active) return "nonaktif";
  if (now < Date.parse(p.starts_at)) return "terjadwal";
  if (now > Date.parse(p.ends_at)) return "berakhir";
  if (p.quota !== null && p.used_count >= p.quota) return "kuota-habis";
  return "berjalan";
}

export function teksJenis(p: Promo): string {
  if (p.type === "percent") return `Diskon ${p.value}%${p.max_discount ? ` maks ${formatRupiah(p.max_discount)}` : ""}`;
  if (p.type === "fixed") return `Potongan ${formatRupiah(p.value)}`;
  return "Gratis biaya layanan";
}
