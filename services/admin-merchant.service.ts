import { CircleAlert, CircleCheck, Clock, Wrench, type LucideIcon } from "lucide-react";
import type { Nada } from "@/lib/order-status";
import type { AksiPenjual, Checklist, StatusVerifikasi } from "@/types/admin";

export const STATUS_VERIFIKASI: Record<StatusVerifikasi, { label: string; tone: Nada; icon: LucideIcon }> = {
  pending: { label: "Menunggu", tone: "warning", icon: Clock },
  needs_fix: { label: "Perlu perbaikan", tone: "warning", icon: Wrench },
  verified: { label: "Terverifikasi", tone: "success", icon: CircleCheck },
  suspended: { label: "Ditangguhkan", tone: "danger", icon: CircleAlert },
};

export const LABEL_CHECKLIST: Record<keyof Checklist, string> = {
  wa_valid: "Nomor WhatsApp valid",
  address: "Alamat terisi",
  pickup_point: "Ada titik temu",
  active_menu: "Ada menu aktif",
  menu_with_photo: "Ada menu dengan foto",
  opening_hours: "Jam buka valid",
};

/** Aksi yang boleh untuk tiap status (K1). */
export const AKSI_BOLEH: Record<StatusVerifikasi, AksiPenjual[]> = {
  pending: ["verify", "request-fix", "suspend"],
  needs_fix: ["verify", "suspend"],
  verified: ["suspend", "close-today"],
  suspended: ["reactivate"],
};

export const checklistLengkap = (c: Checklist) => Object.values(c).every(Boolean);

export const linkWa = (wa: string) => `https://wa.me/62${wa.replace(/\D/g, "").replace(/^(62|0)/, "")}`;

export const LIMIT_PENJUAL = 20;
