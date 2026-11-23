import { CircleAlert, CircleCheck, Clock, Wrench, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/order-status";
import type { MerchantAction, Checklist, VerificationStatus } from "@/types/admin";

export const VERIFICATION_STATUSES: Record<VerificationStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  pending: { label: "Menunggu", tone: "warning", icon: Clock },
  needs_fix: { label: "Perlu perbaikan", tone: "warning", icon: Wrench },
  verified: { label: "Terverifikasi", tone: "success", icon: CircleCheck },
  suspended: { label: "Ditangguhkan", tone: "danger", icon: CircleAlert },
};

export const CHECKLIST_LABELS: Record<keyof Checklist, string> = {
  wa_valid: "Nomor WhatsApp valid",
  address: "Alamat terisi",
  pickup_point: "Ada titik temu",
  active_menu: "Ada menu aktif",
  menu_with_photo: "Ada menu dengan foto",
  opening_hours: "Jam buka valid",
};

/** Aksi yang boleh untuk tiap status (K1). */
export const ALLOWED_ACTIONS: Record<VerificationStatus, MerchantAction[]> = {
  pending: ["verify", "request-fix", "suspend"],
  needs_fix: ["verify", "suspend"],
  verified: ["suspend", "close-today"],
  suspended: ["reactivate"],
};

export const isChecklistComplete = (checklist: Checklist) => Object.values(checklist).every(Boolean);

export const whatsappLink = (waNumber: string) =>
  `https://wa.me/62${waNumber.replace(/\D/g, "").replace(/^(62|0)/, "")}`;

export const LIMIT_MERCHANTS = 20;
