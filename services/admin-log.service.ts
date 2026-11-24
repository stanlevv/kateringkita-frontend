// Label bahasa Indonesia untuk log aktivitas admin: nama aksi, jenis target, dan daftar field yang berubah.
// Tidak memanggil backend: hanya aturan dan label bersama untuk halaman admin dan actions-nya.

import { formatTime, formatDate } from "@/lib/format";
import { MASTER_TABS } from "@/services/admin-master.service";
import { VERIFICATION_STATUSES } from "@/services/admin-merchant.service";
import type { VerificationStatus } from "@/types/admin";

/** Jumlah log per halaman. */
export const LIMIT_LOG = 20;

const MASTER_UNITS: Record<string, string> = Object.fromEntries(MASTER_TABS.map((tab) => [tab.kind, tab.unitName]));
const VERB_LABELS: Record<string, string> = {
  create: "Tambah",
  update: "Ubah",
  activate: "Aktifkan",
  deactivate: "Nonaktifkan",
};

const FIXED_ACTION_LABELS: Record<string, string> = {
  "merchant.verify": "Verifikasi penjual",
  "merchant.request_fix": "Minta perbaikan penjual",
  "merchant.suspend": "Tangguhkan penjual",
  "merchant.reactivate": "Aktifkan lagi penjual",
  "merchant.close_today": "Paksa tutup dapur hari ini",
  "promo.create": "Tambah promo",
  "promo.update": "Ubah promo",
  "promo.activate": "Aktifkan promo",
  "promo.deactivate": "Nonaktifkan promo",
  "promo.archive": "Arsipkan promo",
  "promo.restore": "Pulihkan promo",
  "banner.update": "Ubah banner",
  "banner.archive": "Arsipkan banner",
  "banner.restore": "Pulihkan banner",
  "popup.archive": "Arsipkan pop-up",
  "popup.restore": "Pulihkan pop-up",
  "settings.service_fee": "Ubah biaya layanan",
  "ai.create": "Tambah penyedia AI",
  "ai.update": "Ubah penyedia AI",
  "ai.delete": "Hapus penyedia AI",
  "payout.create": "Catat pencairan dana",
  "refund.mark": "Tandai dana dikembalikan",
  "ticket.reply": "Balas tiket bantuan",
  "ticket.close": "Tutup tiket bantuan",
};

/** Semua aksi yang dikenal, untuk pilihan penyaring: pasangan [kode, label]. */
export const LOG_ACTIONS: [string, string][] = [
  ...Object.entries(FIXED_ACTION_LABELS),
  ...Object.keys(MASTER_UNITS).flatMap((kind) =>
    Object.keys(VERB_LABELS).map((verb): [string, string] => [
      `master.${kind}.${verb}`,
      actionLabel(`master.${kind}.${verb}`),
    ]),
  ),
];

/**
 * Menerjemahkan kode aksi log menjadi label, mis. "master.categories.create" menjadi "Tambah kategori".
 * @param action kode aksi
 * @returns label, atau kode aslinya bila tidak dikenal
 */
export function actionLabel(action: string): string {
  if (FIXED_ACTION_LABELS[action]) return FIXED_ACTION_LABELS[action];
  const match = /^master\.([a-z-]+)\.([a-z]+)$/.exec(action);
  if (match && MASTER_UNITS[match[1]] && VERB_LABELS[match[2]])
    return `${VERB_LABELS[match[2]]} ${MASTER_UNITS[match[1]]}`;
  return action;
}

/** Jenis target untuk penyaring: pasangan [kode, label]. */
export const LOG_TARGETS: [string, string][] = [
  ["merchant", "Penjual"],
  ["categories", "Kategori"],
  ["pickup-points", "Titik temu"],
  ["merchant-types", "Jenis usaha"],
  ["promo", "Promo"],
  ["settings", "Pengaturan"],
  ["ai_provider", "Penyedia AI"],
];

/**
 * Menulis target log, mis. "Penjual #12".
 * @param type jenis target
 * @param id id target
 * @returns label target
 */
export function targetLabel(type: string, id: string): string {
  if (type === "settings") return id === "service_fee" ? "Biaya layanan" : "Pengaturan";
  const label = LOG_TARGETS.find(([key]) => key === type)?.[1] ?? type;
  return `${label} #${id}`;
}

const FIELD_LABELS: Record<string, string> = {
  verification_status: "Status verifikasi",
  verified_at: "Diverifikasi pada",
  verification_note: "Catatan admin",
  suspended_at: "Ditangguhkan pada",
  suspended_reason: "Alasan penangguhan",
  is_open: "Status dapur",
  name: "Nama",
  icon: "Ikon",
  description: "Deskripsi",
  sort_order: "Urutan",
  is_active: "Aktif",
  code: "Kode",
  value: "Nilai",
  starts_at: "Mulai",
  ends_at: "Berakhir",
  quota: "Kuota",
};

const formatValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (field === "verification_status")
    return VERIFICATION_STATUSES[value as VerificationStatus]?.label ?? String(value);
  if (field === "is_open") return value && value !== "0" ? "Buka" : "Tutup";
  if (field === "is_active") return value && value !== "0" ? "ya" : "tidak";
  if (field.endsWith("_at") && typeof value === "string" && !Number.isNaN(Date.parse(value)))
    return `${formatDate(value)}, ${formatTime(value)}`;
  if (typeof value === "boolean") return value ? "ya" : "tidak";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
};

/**
 * Membandingkan data sebelum dan sesudah, lalu mengembalikan field yang berubah dalam teks Indonesia.
 * Field yang tidak dikenal memakai nama aslinya.
 * @param before data sebelum (null bila data baru dibuat)
 * @param after data sesudah
 * @returns daftar `{ field, before, after }` yang nilainya berbeda
 */
export function listChanges(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  return keys
    .map((key) => ({
      field: FIELD_LABELS[key] ?? key,
      before: formatValue(key, before?.[key]),
      after: formatValue(key, after?.[key]),
    }))
    .filter((change) => change.before !== change.after);
}
