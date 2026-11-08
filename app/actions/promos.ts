"use server";

import { galat, galatField } from "@/lib/action-result";
import { getPromos } from "@/services/promoService";
import { bersihkanPromo, cekPromo } from "@/lib/schemas";
import { requireMerchant } from "@/services/authService";
import { getSkenario } from "@/lib/skenario";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";

const idValid = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const argSalah = () => galat("VALIDATION_ERROR", "Data promo tidak valid.");
const kodeDipakai = () => ({ error: { code: "CONFLICT", message: "Kode sudah dipakai.", fields: { code: ["Kode sudah dipakai."] } } });

// shortcut: data contoh sampai F12 (POST /merchant/promos, PATCH /merchant/promos/:id); tidak disimpan (D2)
export async function savePromo(id: number | null, input: unknown): Promise<ActionResult<Promo>> {
  await requireMerchant();
  const s = await getSkenario();
  if (s === "gagal-aksi") return galat("INTERNAL_ERROR", "Promo belum tersimpan. Coba lagi.");

  const daftar = await getPromos();
  if ("error" in daftar) return daftar;
  const lama = id === null ? null : (daftar.data.find((p) => p.id === id) ?? null);
  if (id !== null && !lama) return galat("NOT_FOUND", "Promo tidak ditemukan.");

  const masalah = cekPromo(input, lama?.used_count ?? 0);
  if (Object.keys(masalah).length > 0) {
    return galatField(masalah, "Periksa kembali isian promo.");
  }
  const d = bersihkanPromo(input);
  if (s === "konflik" || daftar.data.some((p) => p.id !== id && p.code === d.code)) return kodeDipakai(); // PR-E1

  return { data: { id: lama?.id ?? Math.max(0, ...daftar.data.map((p) => p.id)) + 1, ...d, used_count: lama?.used_count ?? 0 } };
}

// shortcut: data contoh sampai F12 (PATCH /merchant/promos/:id); tidak disimpan (D2)
export async function setPromoActive(id: number, isActive: boolean): Promise<ActionResult<Promo>> {
  await requireMerchant();
  if (!idValid(id) || typeof isActive !== "boolean") return argSalah();
  const s = await getSkenario();
  if (s === "gagal-aksi") return galat("INTERNAL_ERROR", "Promo belum diubah. Coba lagi.");
  const daftar = await getPromos();
  if ("error" in daftar) return daftar;
  const p = daftar.data.find((x) => x.id === id);
  if (!p) return galat("NOT_FOUND", "Promo tidak ditemukan.");
  return { data: { ...p, is_active: isActive } };
}

// shortcut: data contoh sampai F12 (DELETE /merchant/promos/:id); tidak disimpan (D2)
export async function deletePromo(id: number): Promise<ActionResult<{ id: number }>> {
  await requireMerchant();
  if (!idValid(id)) return argSalah();
  const s = await getSkenario();
  if (s === "gagal-aksi") return galat("INTERNAL_ERROR", "Promo belum dihapus. Coba lagi.");
  const daftar = await getPromos();
  if ("error" in daftar) return daftar;
  const p = daftar.data.find((x) => x.id === id);
  if (!p) return galat("NOT_FOUND", "Promo tidak ditemukan.");
  if (p.used_count > 0) return galat("CONFLICT", "Promo sudah dipakai. Nonaktifkan saja.");
  return { data: { id } };
}
