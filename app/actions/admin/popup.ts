"use server";

// Server action pop-up promo di aplikasi pembeli (mobile): buat atau ubah pop-up.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur: halaman/form -> server action (file ini) -> services/api.ts -> backend. Hanya admin super dan ops; support hanya melihat.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { PopupInput, Popup } from "@/types/popup";

// id dipakai untuk menyusun path API, jadi hanya bilangan bulat positif yang diterima.
const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;

/**
 * Mengecek field pop-up yang diisi saja (field yang tidak ada dilewati, untuk ubah sebagian).
 * @param popup isian pop-up
 * @returns pesan galat per field; objek kosong bila semua benar
 */
function validatePopup(popup: Partial<PopupInput>): Record<string, string> {
  // 1. Judul 3–80 karakter dan gambar wajib ada (bila field-nya dikirim).
  const errors: Record<string, string> = {};
  if (popup.title !== undefined && (popup.title.trim().length < 3 || popup.title.trim().length > 80))
    errors.title = "Judul 3–80 karakter.";
  if (popup.image_url !== undefined && !popup.image_url) errors.image_url = "Unggah gambar pop-up.";
  // 2. Bila periode dikirim, waktu selesai harus setelah waktu mulai.
  if (
    popup.starts_at !== undefined &&
    popup.ends_at !== undefined &&
    !(Date.parse(popup.ends_at) > Date.parse(popup.starts_at))
  ) {
    errors.ends_at = "Waktu selesai harus setelah waktu mulai.";
  }
  return errors;
}

/**
 * Membuat pop-up (id null, POST /admin/popups; judul dan gambar wajib) atau mengubah sebagian (PATCH /admin/popups/:id,
 * mis. `{ is_active: false }`).
 * @param id id pop-up yang diubah, atau null untuk pop-up baru
 * @param input isian pop-up (lengkap untuk pop-up baru, sebagian untuk ubah)
 * @returns `{ data }` berisi pop-up tersimpan; `{ error }` bila id tidak valid, isian salah (pesan per field), atau backend menolak
 */
export async function savePopup(id: number | null, input: Partial<PopupInput>): Promise<ActionResult<Popup>> {
  // 1. Hanya super dan ops; id harus valid.
  await requireAdmin("super", "ops");
  if (id !== null && !isValidId(id)) return errorResult("VALIDATION_ERROR", "Pop-up tidak valid.");
  // 2. Pop-up baru: judul dan gambar kosong ikut dicek agar wajib diisi.
  const errors = validatePopup(id === null ? { title: "", image_url: "", ...input } : input);
  if (Object.keys(errors).length) return fieldErrorResult(errors, "Periksa kembali isian pop-up.");
  // 3. Kirim isian (judul dirapikan bila ada); baru -> POST, lama -> PATCH.
  const body = JSON.stringify(input.title === undefined ? input : { ...input, title: input.title.trim() });
  return toResult(
    await adminFetch<Popup>(id === null ? "/popups" : `/popups/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}
