"use server";

// Server action promo milik penjual: simpan (buat atau ubah), aktif/nonaktif, dan hapus lewat /merchant/promos.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { parsePromo, validatePromo } from "@/lib/schemas";
import { toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";

// id dipakai untuk menyusun path API, jadi hanya bilangan bulat positif yang diterima.
const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const invalidPromoError = () => errorResult("VALIDATION_ERROR", "Data promo tidak valid.");
// Bentuk galat yang sama dengan jawaban backend saat kode promo sudah dipakai (dipakai skenario pratinjau "konflik").
const codeTakenError = () => ({
  error: { code: "CONFLICT", message: "Kode sudah dipakai.", fields: { code: ["Kode sudah dipakai."] } },
});

/**
 * Membuat promo baru (id null, POST /merchant/promos) atau mengubah promo (PATCH /merchant/promos/:id).
 * Validasi isian sama dengan backend (validatePromo); batas kuota terhadap jumlah yang sudah terpakai dicek backend.
 * Skenario pratinjau (/pratinjau, hanya mode pengembangan) bisa memaksa gagal atau kode sudah dipakai.
 * @param id id promo yang diubah, atau null untuk promo baru
 * @param input isian form promo; kunci yang tidak dikenal dibuang
 * @returns `{ data }` berisi promo tersimpan; `{ error }` bila id tidak valid, isian salah (pesan per field),
 *   atau backend menolak (mis. 409 kode sudah dipakai)
 */
export async function savePromo(id: number | null, input: unknown): Promise<ActionResult<Promo>> {
  // 1. Wajib login penjual; id harus valid; skenario pratinjau bisa memaksa gagal.
  await requireMerchant();
  if (id !== null && !isValidId(id)) return invalidPromoError();
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Promo belum tersimpan. Coba lagi.");

  // 2. Cek isian; skenario "konflik" meniru kode promo yang sudah dipakai.
  const errors = validatePromo(input);
  if (Object.keys(errors).length > 0) {
    return fieldErrorResult(errors, "Periksa kembali isian promo.");
  }
  if (scenario === "konflik") return codeTakenError();
  // 3. Kirim isian yang sudah dirapikan (kode huruf besar, field dikenal saja).
  const body = JSON.stringify(parsePromo(input));
  return toResult(
    await merchantFetch<Promo>(id === null ? "/promos" : `/promos/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}

/**
 * Menyalakan atau mematikan promo (PATCH /merchant/promos/:id, field `is_active`).
 * @param id id promo
 * @param isActive true = aktif
 * @returns `{ data }` berisi promo terbaru; `{ error }` bila argumen tidak valid, skenario gagal, atau backend menolak
 */
export async function setPromoActive(id: number, isActive: boolean): Promise<ActionResult<Promo>> {
  await requireMerchant();
  if (!isValidId(id) || typeof isActive !== "boolean") return invalidPromoError();
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Promo belum diubah. Coba lagi.");
  return toResult(
    await merchantFetch<Promo>(`/promos/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) }),
  );
}

/**
 * Menghapus promo (DELETE /merchant/promos/:id). Promo yang sudah pernah dipakai ditolak backend (409); cukup dinonaktifkan.
 * @param id id promo
 * @returns `{ data: { id } }`; `{ error }` bila id tidak valid, skenario gagal, atau backend menolak
 */
export async function deletePromo(id: number): Promise<ActionResult<{ id: number }>> {
  await requireMerchant();
  if (!isValidId(id)) return invalidPromoError();
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Promo belum dihapus. Coba lagi.");
  return toResult(await merchantFetch<{ id: number }>(`/promos/${id}`, { method: "DELETE" }));
}
