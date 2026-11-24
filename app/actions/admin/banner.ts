"use server";

// Server action admin untuk banner beranda dan gambar platform: buat banner platform, tinjau banner penjual, dan minta alamat unggah.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.
// Hanya admin super dan ops; support hanya melihat.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { validateBanner, type BannerInput } from "@/lib/banner";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Banner } from "@/types/banner";

const REJECTION_REASON_MESSAGE = "Tulis alasan penolakan (3–300 karakter).";
// id dipakai untuk menyusun path API, jadi hanya bilangan bulat positif yang diterima.
const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;

/**
 * Membuat banner platform baru (POST /admin/banners). Bentuk parameternya sama dengan `saveMerchantBanner`
 * agar form banner yang sama bisa dipakai; `_id` diabaikan karena admin hanya membuat banner baru di sini.
 * @param _id tidak dipakai
 * @param input isian banner (judul, gambar, tujuan, periode tayang, urutan)
 * @returns `{ data }` berisi banner baru; `{ error }` bila isian salah (pesan per field) atau backend menolak
 */
export async function createAdminBanner(_id: number | null, input: BannerInput): Promise<ActionResult<Banner>> {
  await requireAdmin("super", "ops");
  const errors = validateBanner(input);
  if (Object.keys(errors).length) return fieldErrorResult(errors, "Periksa kembali isian banner.");
  const body = JSON.stringify({ ...input, title: input.title.trim() });
  return toResult(await adminFetch<Banner>("/banners", { method: "POST", body }));
}

/** Isian tinjauan banner: status baru, catatan (wajib bila ditolak), dan/atau urutan tayang. */
type BannerReviewInput = { status?: "disetujui" | "ditolak" | "nonaktif"; catatan?: string; sort_order?: number };

/**
 * Meninjau banner (PATCH /admin/banners/:id): setujui, tolak, nonaktifkan, atau ubah urutan.
 * @param id id banner
 * @param review status baru, `catatan` (alasan 3–300 karakter, wajib bila "ditolak"), dan/atau `sort_order`
 * @returns `{ data }` berisi banner terbaru; `{ error }` bila id tidak valid, alasan tolak kurang/kelebihan, atau backend menolak
 */
export async function reviewAdminBanner(id: number, review: BannerReviewInput): Promise<ActionResult<Banner>> {
  // 1. Hanya super dan ops; id harus valid.
  await requireAdmin("super", "ops");
  if (!isValidId(id)) return errorResult("VALIDATION_ERROR", "Banner tidak valid.");
  // 2. Tolak wajib beralasan 3–300 karakter.
  const note = review.catatan?.trim();
  if (review.status === "ditolak" && (!note || note.length < 3 || note.length > 300))
    return fieldErrorResult({ catatan: REJECTION_REASON_MESSAGE }, "Periksa kembali alasan.");
  // 3. Kirim tinjauan; catatan yang sudah dirapikan menggantikan aslinya.
  const body = JSON.stringify({ ...review, ...(note ? { catatan: note } : {}) });
  return toResult(await adminFetch<Banner>(`/banners/${id}`, { method: "PATCH", body }));
}

/**
 * Meminta alamat unggah bertanda tangan untuk gambar banner atau pop-up platform (POST /admin/uploads).
 * Browser lalu mengunggah file langsung ke alamat itu.
 * @param file tujuan gambar (`purpose`), jenis file (`content_type`), dan ukuran dalam byte (`size`)
 * @returns `{ data: { upload_url, public_url, expires_at } }`, atau `{ error }` dari backend
 */
export async function requestAdminUpload(file: {
  purpose: string;
  content_type: string;
  size: number;
}): Promise<ActionResult<{ upload_url: string; public_url: string; expires_at: string }>> {
  await requireAdmin("super", "ops");
  return toResult(
    await adminFetch<{ upload_url: string; public_url: string; expires_at: string }>("/uploads", {
      method: "POST",
      body: JSON.stringify(file),
    }),
  );
}
