// Aturan data master admin (kategori, titik temu, jenis usaha) dan biaya layanan:
// tab di URL, batas panjang (sama dengan be/src/admin/master.ts), dan validasi bersama untuk form dan server action.
// Tidak memanggil backend: hanya aturan dan label bersama untuk halaman admin dan actions-nya.

import type { MasterKind } from "@/types/admin";

/**
 * Pengaturan tiap tab data master: id di URL, jenis data, label, field tambahan (ikon/deskripsi), batas panjang, dan bisa diurutkan atau tidak.
 */
export const MASTER_TABS: {
  id: string;
  kind: MasterKind;
  label: string;
  unitName: string;
  extraField?: "icon" | "description";
  extraFieldLabel?: string;
  extraFieldMax?: number;
  nameMax: number;
  sortable: boolean;
}[] = [
  {
    id: "kategori",
    kind: "categories",
    label: "Kategori",
    unitName: "kategori",
    extraField: "icon",
    extraFieldLabel: "Ikon",
    extraFieldMax: 40,
    nameMax: 60,
    sortable: true,
  },
  {
    id: "titik-temu",
    kind: "pickup-points",
    label: "Titik temu",
    unitName: "titik temu",
    extraField: "description",
    extraFieldLabel: "Deskripsi",
    extraFieldMax: 255,
    nameMax: 120,
    sortable: false,
  },
  {
    id: "jenis-usaha",
    kind: "merchant-types",
    label: "Jenis usaha",
    unitName: "jenis usaha",
    nameMax: 100,
    sortable: true,
  },
];

/**
 * Mencari tab berdasarkan jenis data.
 * @param kind jenis data, mis. "categories"
 * @returns tab, atau undefined bila jenisnya tidak dikenal
 */
export const tabByKind = (kind: string) => MASTER_TABS.find((tab) => tab.kind === kind);
/**
 * Mencari tab berdasarkan id di URL.
 * @param id nilai `?tab=`
 * @returns tab, atau tab pertama (kategori) bila tidak dikenal
 */
export const tabById = (id: string | undefined) => MASTER_TABS.find((tab) => tab.id === id) ?? MASTER_TABS[0];

/** Isian form data master. */
export type MasterInput = { name: string; icon?: string; description?: string };

/**
 * Memeriksa isian form data master: nama wajib dan batas panjang tiap field.
 * @param kind jenis data
 * @param input isian
 * @returns pesan per field; objek kosong bila valid
 */
export function validateMaster(kind: string, input: unknown): Record<string, string> {
  // 1. Cari aturan tab untuk jenis data ini; jenis tidak dikenal langsung ditolak.
  const tab = tabByKind(kind);
  const data = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (!tab) return { name: "Jenis data tidak dikenal." };
  // 2. Nama wajib dan tidak melewati batas panjang.
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) errors.name = "Nama wajib diisi.";
  else if (name.length > tab.nameMax) errors.name = `Nama maksimal ${tab.nameMax} karakter.`;
  // 3. Field tambahan (ikon atau deskripsi) harus teks dan tidak melewati batas panjang.
  if (tab.extraField && data[tab.extraField] != null) {
    const value = data[tab.extraField];
    if (typeof value !== "string") errors[tab.extraField] = `${tab.extraFieldLabel} tidak valid.`;
    else if (value.trim().length > (tab.extraFieldMax ?? 0))
      errors[tab.extraField] = `${tab.extraFieldLabel} maksimal ${tab.extraFieldMax} karakter.`;
  }
  return errors;
}

/**
 * Menyusun body ke backend: hanya field milik jenis ini, sudah dirapikan. Panggil setelah `validateMaster` kosong.
 * @param kind jenis data
 * @param input isian
 * @returns body JSON untuk backend
 */
export function toMasterBody(kind: string, input: MasterInput): Record<string, string | null> {
  const tab = tabByKind(kind)!;
  const body: Record<string, string | null> = { name: input.name.trim() };
  if (tab.extraField) body[tab.extraField] = (input[tab.extraField] ?? "").trim() || null;
  return body;
}

// Batas biaya layanan (rupiah), sama dengan backend.
const MAX_SERVICE_FEE = 100_000;
/**
 * Memeriksa biaya layanan: bilangan bulat, tidak negatif, paling banyak Rp 100.000.
 * @param value nilai isian
 * @returns pesan galat, atau undefined bila valid
 */
export function validateServiceFee(value: unknown): string | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) return "Biaya harus bilangan bulat.";
  if (value < 0) return "Biaya tidak boleh negatif.";
  if (value > MAX_SERVICE_FEE) return "Biaya maksimal Rp 100.000.";
}
