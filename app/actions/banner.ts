"use server";

// Server action banner beranda milik penjual: simpan (buat atau ubah) dan hapus lewat /merchant/banners.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { validateBanner, type BannerInput } from "@/lib/banner";
import { toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Banner } from "@/types/banner";

// id dipakai untuk menyusun path API, jadi hanya bilangan bulat positif yang diterima.
const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;

/**
 * Membuat banner baru (id null, POST) atau mengubah banner (PATCH). Aturan isian sama dengan backend;
 * batas satu banner aktif per toko dicek backend.
 * @param id id banner yang diubah, atau null untuk banner baru
 * @param input isian banner (judul, gambar, tujuan, promo, periode tayang)
 * @returns `{ data }` berisi banner tersimpan; `{ error }` bila id tidak valid, isian salah (pesan per field), atau backend menolak
 */
export async function saveMerchantBanner(id: number | null, input: BannerInput): Promise<ActionResult<Banner>> {
  // 1. Wajib login penjual; cek id dan isian.
  await requireMerchant();
  if (id !== null && !isValidId(id)) return errorResult("VALIDATION_ERROR", "Banner tidak valid.");
  const errors = validateBanner(input);
  if (Object.keys(errors).length) return fieldErrorResult(errors, "Periksa kembali isian banner.");
  // 2. Kirim hanya field yang dikenal backend; judul dirapikan.
  const body = JSON.stringify({
    title: input.title.trim(),
    image_url: input.image_url,
    target: input.target,
    promo_id: input.promo_id,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
  });
  // 3. Banner baru -> POST /banners, banner lama -> PATCH /banners/:id.
  return toResult(
    await merchantFetch<Banner>(id === null ? "/banners" : `/banners/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}

/**
 * Menghapus banner milik penjual (DELETE /merchant/banners/:id).
 * @param id id banner
 * @returns `{ data: { id } }`; `{ error }` bila id tidak valid atau backend menolak (mis. banner tidak ditemukan)
 */
export async function deleteMerchantBanner(id: number): Promise<ActionResult<{ id: number }>> {
  await requireMerchant();
  if (!isValidId(id)) return errorResult("VALIDATION_ERROR", "Banner tidak valid.");
  return toResult(await merchantFetch<{ id: number }>(`/banners/${id}`, { method: "DELETE" }));
}
