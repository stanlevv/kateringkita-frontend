import { formatJam, formatTanggal } from "@/lib/format";
import { TAB_MASTER } from "@/services/adminMasterService";
import { STATUS_VERIFIKASI } from "@/services/adminMerchantService";
import type { StatusVerifikasi } from "@/types/admin";

export const LIMIT_LOG = 20;

const MASTER: Record<string, string> = Object.fromEntries(TAB_MASTER.map((t) => [t.kind, t.satuan]));
const VERBA: Record<string, string> = { create: "Tambah", update: "Ubah", activate: "Aktifkan", deactivate: "Nonaktifkan" };

const TETAP: Record<string, string> = {
  "merchant.verify": "Verifikasi penjual",
  "merchant.request_fix": "Minta perbaikan penjual",
  "merchant.suspend": "Tangguhkan penjual",
  "merchant.reactivate": "Aktifkan lagi penjual",
  "merchant.close_today": "Paksa tutup dapur hari ini",
  "promo.create": "Tambah promo",
  "promo.update": "Ubah promo",
  "promo.activate": "Aktifkan promo",
  "promo.deactivate": "Nonaktifkan promo",
  "settings.service_fee": "Ubah biaya layanan",
  "ai.create": "Tambah penyedia AI",
  "ai.update": "Ubah penyedia AI",
  "ai.delete": "Hapus penyedia AI",
  "payout.create": "Catat pencairan dana",
  "refund.mark": "Tandai dana dikembalikan",
  "ticket.reply": "Balas tiket bantuan",
  "ticket.close": "Tutup tiket bantuan",
};

/** Semua aksi yang dikenal, untuk pilihan filter: [kode, label]. */
export const AKSI_LOG: [string, string][] = [
  ...Object.entries(TETAP),
  ...Object.keys(MASTER).flatMap((k) => Object.keys(VERBA).map((v): [string, string] => [`master.${k}.${v}`, labelAksi(`master.${k}.${v}`)])),
];

export function labelAksi(action: string): string {
  if (TETAP[action]) return TETAP[action];
  const m = /^master\.([a-z-]+)\.([a-z]+)$/.exec(action);
  if (m && MASTER[m[1]] && VERBA[m[2]]) return `${VERBA[m[2]]} ${MASTER[m[1]]}`;
  return action;
}

/** Jenis target untuk filter: [kode, label]. */
export const TARGET_LOG: [string, string][] = [
  ["merchant", "Penjual"],
  ["categories", "Kategori"],
  ["pickup-points", "Titik temu"],
  ["merchant-types", "Jenis usaha"],
  ["promo", "Promo"],
  ["settings", "Pengaturan"],
  ["ai_provider", "Penyedia AI"],
];

export function labelTarget(type: string, id: string): string {
  if (type === "settings") return id === "service_fee" ? "Biaya layanan" : "Pengaturan";
  const label = TARGET_LOG.find(([k]) => k === type)?.[1] ?? type;
  return `${label} #${id}`;
}

const FIELD: Record<string, string> = {
  verification_status: "Status verifikasi", verified_at: "Diverifikasi pada", verification_note: "Catatan admin",
  suspended_at: "Ditangguhkan pada", suspended_reason: "Alasan penangguhan", is_open: "Status dapur",
  name: "Nama", icon: "Ikon", description: "Deskripsi", sort_order: "Urutan", is_active: "Aktif",
  code: "Kode", value: "Nilai", starts_at: "Mulai", ends_at: "Berakhir", quota: "Kuota",
};

const nilai = (field: string, v: unknown): string => {
  if (v === null || v === undefined) return "—";
  if (field === "verification_status") return STATUS_VERIFIKASI[v as StatusVerifikasi]?.label ?? String(v);
  if (field === "is_open") return v && v !== "0" ? "Buka" : "Tutup";
  if (field === "is_active") return v && v !== "0" ? "ya" : "tidak";
  if (field.endsWith("_at") && typeof v === "string" && !Number.isNaN(Date.parse(v))) return `${formatTanggal(v)}, ${formatJam(v)}`;
  if (typeof v === "boolean") return v ? "ya" : "tidak";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
};

/** Field yang berubah dari `before` ke `after`, sudah berbentuk teks Indonesia; field tak dikenal memakai nama aslinya. */
export function daftarPerubahan(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const kunci = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  return kunci
    .map((k) => ({ field: FIELD[k] ?? k, lama: nilai(k, before?.[k]), baru: nilai(k, after?.[k]) }))
    .filter((p) => p.lama !== p.baru);
}
