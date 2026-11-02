import type { KindMaster } from "./types";

// A-01…A-03 — tab di URL, batas panjang (cermin be/src/admin/master.ts), dan validasi bersama form & server action.
export const TAB_MASTER: { id: string; kind: KindMaster; label: string; satuan: string; kolom?: "icon" | "description"; kolomLabel?: string; kolomMax?: number; nameMax: number; urut: boolean }[] = [
  { id: "kategori", kind: "categories", label: "Kategori", satuan: "kategori", kolom: "icon", kolomLabel: "Ikon", kolomMax: 40, nameMax: 60, urut: true },
  { id: "titik-temu", kind: "pickup-points", label: "Titik temu", satuan: "titik temu", kolom: "description", kolomLabel: "Deskripsi", kolomMax: 255, nameMax: 120, urut: false },
  { id: "jenis-usaha", kind: "merchant-types", label: "Jenis usaha", satuan: "jenis usaha", nameMax: 100, urut: true },
];

export const tabDariKind = (kind: string) => TAB_MASTER.find((t) => t.kind === kind);
export const tabDariId = (id: string | undefined) => TAB_MASTER.find((t) => t.id === id) ?? TAB_MASTER[0];

export type IsianMaster = { name: string; icon?: string; description?: string };

export function cekMaster(kind: string, nilai: unknown): Record<string, string> {
  const t = tabDariKind(kind);
  const d = (typeof nilai === "object" && nilai !== null ? nilai : {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  if (!t) return { name: "Jenis data tidak dikenal." };
  const name = typeof d.name === "string" ? d.name.trim() : "";
  if (!name) out.name = "Nama wajib diisi.";
  else if (name.length > t.nameMax) out.name = `Nama maksimal ${t.nameMax} karakter.`;
  if (t.kolom && d[t.kolom] != null) {
    const v = d[t.kolom];
    if (typeof v !== "string") out[t.kolom] = `${t.kolomLabel} tidak valid.`;
    else if (v.trim().length > (t.kolomMax ?? 0)) out[t.kolom] = `${t.kolomLabel} maksimal ${t.kolomMax} karakter.`;
  }
  return out;
}

/** Body ke backend: hanya field milik jenis ini, dirapikan. Panggil setelah cekMaster kosong. */
export function bersihkanMaster(kind: string, nilai: IsianMaster): Record<string, string | null> {
  const t = tabDariKind(kind)!;
  const out: Record<string, string | null> = { name: nilai.name.trim() };
  if (t.kolom) out[t.kolom] = (nilai[t.kolom] ?? "").trim() || null;
  return out;
}

// A-04 — biaya layanan
const BIAYA_MAKS = 100_000;
export function cekBiaya(v: unknown): string | undefined {
  if (typeof v !== "number" || !Number.isInteger(v)) return "Biaya harus bilangan bulat.";
  if (v < 0) return "Biaya tidak boleh negatif.";
  if (v > BIAYA_MAKS) return "Biaya maksimal Rp 100.000.";
}
