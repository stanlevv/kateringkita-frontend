"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { parsePromo, validatePromo } from "@/lib/schemas";
import { toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";

const idValid = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const argSalah = () => errorResult("VALIDATION_ERROR", "Data promo tidak valid.");
const kodeDipakai = () => ({
  error: { code: "CONFLICT", message: "Kode sudah dipakai.", fields: { code: ["Kode sudah dipakai."] } },
});

// F12: POST /merchant/promos, PATCH /merchant/promos/:id. Validasi sama dengan backend (cekPromo); kuota vs terpakai dicek backend.
export async function savePromo(id: number | null, input: unknown): Promise<ActionResult<Promo>> {
  await requireMerchant();
  if (id !== null && !idValid(id)) return argSalah();
  const s = await getScenario();
  if (s === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Promo belum tersimpan. Coba lagi.");

  const masalah = validatePromo(input);
  if (Object.keys(masalah).length > 0) {
    return fieldErrorResult(masalah, "Periksa kembali isian promo.");
  }
  if (s === "konflik") return kodeDipakai(); // PR-E1
  const body = JSON.stringify(parsePromo(input));
  return toResult(
    await merchantFetch<Promo>(id === null ? "/promos" : `/promos/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}

export async function setPromoActive(id: number, isActive: boolean): Promise<ActionResult<Promo>> {
  await requireMerchant();
  if (!idValid(id) || typeof isActive !== "boolean") return argSalah();
  const s = await getScenario();
  if (s === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Promo belum diubah. Coba lagi.");
  return toResult(
    await merchantFetch<Promo>(`/promos/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) }),
  );
}

// PR-N3: backend menolak (409) promo yang sudah dipakai
export async function deletePromo(id: number): Promise<ActionResult<{ id: number }>> {
  await requireMerchant();
  if (!idValid(id)) return argSalah();
  const s = await getScenario();
  if (s === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Promo belum dihapus. Coba lagi.");
  return toResult(await merchantFetch<{ id: number }>(`/promos/${id}`, { method: "DELETE" }));
}
