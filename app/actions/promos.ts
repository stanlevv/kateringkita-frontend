"use server";

import { galat, galatField } from "@/lib/action-result";
import { bersihkanPromo, cekPromo } from "@/lib/schemas";
import { hasil, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/authService";
import { getSkenario } from "@/lib/skenario";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";

const idValid = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const argSalah = () => galat("VALIDATION_ERROR", "Data promo tidak valid.");
const kodeDipakai = () => ({ error: { code: "CONFLICT", message: "Kode sudah dipakai.", fields: { code: ["Kode sudah dipakai."] } } });

// F12: POST /merchant/promos, PATCH /merchant/promos/:id. Validasi sama dengan backend (cekPromo); kuota vs terpakai dicek backend.
export async function savePromo(id: number | null, input: unknown): Promise<ActionResult<Promo>> {
  await requireMerchant();
  if (id !== null && !idValid(id)) return argSalah();
  const s = await getSkenario();
  if (s === "gagal-aksi") return galat("INTERNAL_ERROR", "Promo belum tersimpan. Coba lagi.");

  const masalah = cekPromo(input);
  if (Object.keys(masalah).length > 0) {
    return galatField(masalah, "Periksa kembali isian promo.");
  }
  if (s === "konflik") return kodeDipakai(); // PR-E1
  const body = JSON.stringify(bersihkanPromo(input));
  return hasil(await merchantFetch<Promo>(id === null ? "/promos" : `/promos/${id}`, { method: id === null ? "POST" : "PATCH", body }));
}

export async function setPromoActive(id: number, isActive: boolean): Promise<ActionResult<Promo>> {
  await requireMerchant();
  if (!idValid(id) || typeof isActive !== "boolean") return argSalah();
  const s = await getSkenario();
  if (s === "gagal-aksi") return galat("INTERNAL_ERROR", "Promo belum diubah. Coba lagi.");
  return hasil(await merchantFetch<Promo>(`/promos/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) }));
}

// PR-N3: backend menolak (409) promo yang sudah dipakai
export async function deletePromo(id: number): Promise<ActionResult<{ id: number }>> {
  await requireMerchant();
  if (!idValid(id)) return argSalah();
  const s = await getSkenario();
  if (s === "gagal-aksi") return galat("INTERNAL_ERROR", "Promo belum dihapus. Coba lagi.");
  return hasil(await merchantFetch<{ id: number }>(`/promos/${id}`, { method: "DELETE" }));
}
