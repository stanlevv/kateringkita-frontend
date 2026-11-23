import type { MasterKind } from "@/types/admin";

// A-01…A-03 — tab di URL, batas panjang (cermin be/src/admin/master.ts), dan validasi bersama form & server action.
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

export const tabByKind = (kind: string) => MASTER_TABS.find((tab) => tab.kind === kind);
export const tabById = (id: string | undefined) => MASTER_TABS.find((tab) => tab.id === id) ?? MASTER_TABS[0];

export type MasterInput = { name: string; icon?: string; description?: string };

export function validateMaster(kind: string, input: unknown): Record<string, string> {
  const tab = tabByKind(kind);
  const data = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (!tab) return { name: "Jenis data tidak dikenal." };
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) errors.name = "Nama wajib diisi.";
  else if (name.length > tab.nameMax) errors.name = `Nama maksimal ${tab.nameMax} karakter.`;
  if (tab.extraField && data[tab.extraField] != null) {
    const value = data[tab.extraField];
    if (typeof value !== "string") errors[tab.extraField] = `${tab.extraFieldLabel} tidak valid.`;
    else if (value.trim().length > (tab.extraFieldMax ?? 0))
      errors[tab.extraField] = `${tab.extraFieldLabel} maksimal ${tab.extraFieldMax} karakter.`;
  }
  return errors;
}

/** Body ke backend: hanya field milik jenis ini, dirapikan. Panggil setelah cekMaster kosong. */
export function toMasterBody(kind: string, input: MasterInput): Record<string, string | null> {
  const tab = tabByKind(kind)!;
  const body: Record<string, string | null> = { name: input.name.trim() };
  if (tab.extraField) body[tab.extraField] = (input[tab.extraField] ?? "").trim() || null;
  return body;
}

// A-04 — biaya layanan
const MAX_SERVICE_FEE = 100_000;
export function validateServiceFee(value: unknown): string | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) return "Biaya harus bilangan bulat.";
  if (value < 0) return "Biaya tidak boleh negatif.";
  if (value > MAX_SERVICE_FEE) return "Biaya maksimal Rp 100.000.";
}
