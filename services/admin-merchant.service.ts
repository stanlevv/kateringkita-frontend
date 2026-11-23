// Label dan aturan tampilan penjual di panel admin: status verifikasi, checklist kesiapan toko, dan tindakan yang boleh.
// Tidak memanggil backend: hanya aturan dan label bersama untuk halaman admin dan actions-nya.

import { CircleAlert, CircleCheck, Clock, Wrench, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/order-status";
import type { MerchantAction, Checklist, VerificationStatus } from "@/types/admin";

/** Label, warna, dan ikon tiap status verifikasi. */
export const VERIFICATION_STATUSES: Record<VerificationStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  pending: { label: "Menunggu", tone: "warning", icon: Clock },
  needs_fix: { label: "Perlu perbaikan", tone: "warning", icon: Wrench },
  verified: { label: "Terverifikasi", tone: "success", icon: CircleCheck },
  suspended: { label: "Ditangguhkan", tone: "danger", icon: CircleAlert },
};

/** Label tiap butir checklist kesiapan toko. */
export const CHECKLIST_LABELS: Record<keyof Checklist, string> = {
  wa_valid: "Nomor WhatsApp valid",
  address: "Alamat terisi",
  pickup_point: "Ada titik temu",
  active_menu: "Ada menu aktif",
  menu_with_photo: "Ada menu dengan foto",
  opening_hours: "Jam buka valid",
};

/** Tindakan admin yang boleh untuk tiap status verifikasi (sama dengan aturan backend). */
export const ALLOWED_ACTIONS: Record<VerificationStatus, MerchantAction[]> = {
  pending: ["verify", "request-fix", "suspend"],
  needs_fix: ["verify", "suspend"],
  verified: ["suspend", "close-today"],
  suspended: ["reactivate"],
};

/** Mengecek apakah semua butir checklist terpenuhi. */
export const isChecklistComplete = (checklist: Checklist) => Object.values(checklist).every(Boolean);

/**
 * Membuat tautan wa.me dari nomor WA (awalan 0 atau 62 dinormalkan).
 * @param waNumber nomor WA penjual
 */
export const whatsappLink = (waNumber: string) =>
  `https://wa.me/62${waNumber.replace(/\D/g, "").replace(/^(62|0)/, "")}`;

/** Jumlah penjual per halaman. */
export const LIMIT_MERCHANTS = 20;
