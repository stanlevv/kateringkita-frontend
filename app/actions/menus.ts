"use server";

// Server action menu penjual: ubah kuota, aktif/nonaktif, simpan menu, dan minta alamat unggah foto.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult } from "@/lib/action-result";
import { toResult, merchantFetch } from "@/services/api";
import { menuFormSchema } from "@/lib/schemas";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";
import type { MerchantMenu } from "@/types/menu";

// id dipakai untuk menyusun path API, jadi hanya bilangan bulat positif yang diterima (mencegah path seperti "../profile").
const isValidMenuId = (id: unknown) => typeof id === "number" && Number.isInteger(id) && id > 0;
const menuNotFound = () => errorResult("NOT_FOUND", "Menu tidak ditemukan.");

/**
 * Mengubah kuota hari ini sebuah menu (PATCH /merchant/menus/:id/quota): menambah/mengurangi (`delta`) atau mengisi nilai baru (`quota_today`).
 * Skenario pratinjau (/pratinjau, hanya mode pengembangan) bisa memaksa gagal atau konflik tanpa memanggil backend.
 * @param menuId id menu
 * @param change `{ delta }` atau `{ quota_today }`, dikirim apa adanya
 * @returns `{ data }` berisi menu terbaru; `{ error }` bila data tidak valid, skenario gagal,
 *   atau backend menolak (mis. 409 kuota di bawah porsi yang sudah dipesan)
 */
export async function adjustQuota(
  menuId: number,
  change: { delta: number } | { quota_today: number },
): Promise<ActionResult<MerchantMenu>> {
  // 1. Wajib login penjual; id dan bentuk perubahan harus benar.
  await requireMerchant();
  const changeFields = (typeof change === "object" && change !== null ? change : {}) as Record<string, unknown>;
  if (
    !isValidMenuId(menuId) ||
    !(typeof changeFields.delta === "number" || typeof changeFields.quota_today === "number")
  ) {
    return errorResult("VALIDATION_ERROR", "Data kuota tidak valid.");
  }
  // 2. Skenario pratinjau bisa memaksa gagal atau konflik.
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Kuota belum tersimpan. Coba lagi.");
  if (scenario === "konflik")
    return errorResult("CONFLICT", "Kuota sudah diubah di tempat lain. Muat ulang lalu coba lagi.");
  // 3. Kirim perubahan ke backend.
  return toResult(
    await merchantFetch<MerchantMenu>(`/menus/${menuId}/quota`, { method: "PATCH", body: JSON.stringify(change) }),
  );
}

/**
 * Menampilkan atau menyembunyikan menu dari katalog pembeli (PATCH /merchant/menus/:id, field `is_active`).
 * @param menuId id menu
 * @param isActive true = tampil
 * @returns `{ data }` berisi menu terbaru; `{ error }` bila id tidak valid (NOT_FOUND), skenario gagal, atau backend menolak
 */
export async function setMenuActive(menuId: number, isActive: boolean): Promise<ActionResult<MerchantMenu>> {
  await requireMerchant();
  if (!isValidMenuId(menuId)) return menuNotFound();
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Menu belum diubah. Coba lagi.");
  return toResult(
    await merchantFetch<MerchantMenu>(`/menus/${menuId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    }),
  );
}

/**
 * Membuat menu baru (id null, POST /merchant/menus) atau mengubah menu (PATCH /merchant/menus/:id).
 * Isian dicek dengan skema form menu yang sama (mis. harga harus lebih besar dari HPP); yang dikirim adalah hasil cek yang sudah dirapikan.
 * @param id id menu yang diubah, atau null untuk menu baru
 * @param input isian form menu
 * @returns `{ data }` berisi menu tersimpan; `{ error }` bila id tidak valid (NOT_FOUND), isian salah (pesan per field),
 *   skenario gagal, atau backend menolak
 */
export async function saveMenu(id: number | null, input: unknown): Promise<ActionResult<MerchantMenu>> {
  // 1. Wajib login penjual; id harus valid; skenario pratinjau bisa memaksa gagal.
  await requireMerchant();
  if (id !== null && !isValidMenuId(id)) return menuNotFound();
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Menu belum tersimpan. Coba lagi.");

  // 2. Cek isian; setiap masalah dikumpulkan per nama field (mis. "options.0.name").
  const parsed = menuFormSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) (fields[issue.path.join(".")] ??= []).push(issue.message);
    return { error: { code: "VALIDATION_ERROR", message: "Periksa kembali isian menu.", fields } };
  }
  // 3. Menu baru -> POST /menus, menu lama -> PATCH /menus/:id.
  const path = id === null ? "/menus" : `/menus/${id}`;
  return toResult(
    await merchantFetch<MerchantMenu>(path, {
      method: id === null ? "POST" : "PATCH",
      body: JSON.stringify(parsed.data),
    }),
  );
}

/**
 * Meminta alamat unggah bertanda tangan untuk foto (POST /merchant/uploads). Browser lalu mengunggah file langsung ke alamat itu.
 * @param file tujuan foto (`purpose`: menu, logo, banner, atau cover), jenis file (`content_type`), dan ukuran dalam byte (`size`)
 * @returns `{ data: { upload_url, public_url, expires_at } }`; `{ error }` bila skenario gagal atau backend menolak (mis. unggah belum tersedia)
 */
export async function requestUpload(file: {
  purpose: "menu" | "logo" | "banner" | "cover";
  content_type: string;
  size: number;
}): Promise<ActionResult<{ upload_url: string; public_url: string; expires_at: string }>> {
  await requireMerchant();
  if ((await getScenario()) === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Foto gagal diunggah. Coba lagi");
  return toResult(
    await merchantFetch<{ upload_url: string; public_url: string; expires_at: string }>("/uploads", {
      method: "POST",
      body: JSON.stringify(file),
    }),
  );
}
