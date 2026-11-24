"use server";

// Server action data master (kategori, jenis penjual, titik temu): simpan, aktif/nonaktif, dan tukar urutan tampil.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> services (admin-master.service untuk
// aturan isian) -> api.ts -> backend.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { toMasterBody, validateMaster, tabByKind, type MasterInput } from "@/services/admin-master.service";
import type { MasterItem } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

// id dipakai untuk menyusun path API, jadi hanya bilangan bulat positif yang diterima.
const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const isValidSortOrder = (value: unknown) => Number.isInteger(value) && (value as number) >= 0;
const invalidDataError = () => errorResult("VALIDATION_ERROR", "Data tidak valid.");

/**
 * Membuat (id null, POST /admin/master/:kind) atau mengubah (PATCH /admin/master/:kind/:id) satu data master.
 * Hanya field milik jenis data itu yang dikirim. Galat 409 dari backend (nama kembar) diteruskan apa adanya.
 * @param kind jenis data dari daftar yang diizinkan, mis. "categories", "merchant-types", "pickup-points"
 * @param id id data yang diubah, atau null untuk data baru
 * @param input isian form (nama dan field tambahan sesuai jenis)
 * @returns `{ data }` berisi data tersimpan; `{ error }` bila jenis/id tidak valid, isian salah (pesan per field), atau backend menolak
 */
export async function saveMaster(kind: string, id: number | null, input: unknown): Promise<ActionResult<MasterItem>> {
  // 1. Wajib admin; jenis harus ada di daftar yang diizinkan dan id harus valid.
  await requireAdmin();
  if (!tabByKind(kind) || (id !== null && !isValidId(id))) return invalidDataError();
  // 2. Cek isian, lalu susun isi permintaan dengan field milik jenis ini saja.
  const errors = validateMaster(kind, input);
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali isian.");
  const body = JSON.stringify(toMasterBody(kind, input as MasterInput));
  // 3. Data baru -> POST, data lama -> PATCH.
  return toResult(
    await adminFetch<MasterItem>(id === null ? `/master/${kind}` : `/master/${kind}/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}

/**
 * Mengaktifkan atau menonaktifkan data master (POST /admin/master/:kind/:id/activate atau /deactivate).
 * @param kind jenis data dari daftar yang diizinkan
 * @param id id data
 * @param active true = aktifkan
 * @returns `{ data }` berisi data terbaru; `{ error }` bila argumen tidak valid atau backend menolak
 *   (mis. 409 titik temu satu-satunya milik sebuah toko)
 */
export async function setMasterActive(kind: string, id: number, active: boolean): Promise<ActionResult<MasterItem>> {
  await requireAdmin();
  if (!tabByKind(kind) || !isValidId(id) || typeof active !== "boolean") return invalidDataError();
  return toResult(
    await adminFetch<MasterItem>(`/master/${kind}/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" }),
  );
}

/** Satu baris yang urutannya ditukar: id dan nilai `sort_order` saat ini. */
type SortOrderItem = { id: number; sort_order: number };

/**
 * Menukar `sort_order` dua baris bertetangga dengan dua PATCH berurutan. Nilai keduanya harus berbeda agar urutan pasti berubah.
 * Bila PATCH kedua gagal, PATCH pertama dibatalkan (nilai lama dikembalikan) agar urutan tidak setengah tertukar.
 * @param kind jenis data yang bisa diurutkan (titik temu tidak bisa)
 * @param first baris pertama
 * @param second baris kedua
 * @returns `{ data: null }` bila berhasil; `{ error }` bila argumen tidak valid atau salah satu PATCH gagal
 */
export async function swapSortOrder(
  kind: string,
  first: SortOrderItem,
  second: SortOrderItem,
): Promise<ActionResult<null>> {
  // 1. Wajib admin; jenis harus bisa diurutkan, dua baris berbeda dengan urutan valid dan tidak sama.
  await requireAdmin();
  const tab = tabByKind(kind);
  if (
    !tab?.sortable ||
    !first ||
    !second ||
    !isValidId(first.id) ||
    !isValidId(second.id) ||
    first.id === second.id ||
    !isValidSortOrder(first.sort_order) ||
    !isValidSortOrder(second.sort_order) ||
    first.sort_order === second.sort_order
  )
    return invalidDataError();
  // 2. Beri baris pertama urutan baris kedua.
  const patchSortOrder = (id: number, sortOrder: number) =>
    adminFetch<null>(`/master/${kind}/${id}`, { method: "PATCH", body: JSON.stringify({ sort_order: sortOrder }) });
  const firstResult = await patchSortOrder(first.id, second.sort_order);
  if (!firstResult.ok) return toResult(firstResult);
  // 3. Beri baris kedua urutan baris pertama; bila gagal, kembalikan baris pertama ke nilai lamanya.
  const secondResult = await patchSortOrder(second.id, first.sort_order);
  if (!secondResult.ok) {
    await patchSortOrder(first.id, first.sort_order).catch(() => undefined);
    return toResult(secondResult);
  }
  return { data: null };
}
