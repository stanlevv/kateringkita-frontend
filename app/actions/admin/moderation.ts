"use server";

// Server action moderasi konten oleh admin: sembunyikan/tampilkan ulasan, turunkan/pulihkan menu, dan hapus satu foto menu.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ModerationAction, ModerationMenu, ModerationReview } from "@/types/admin";
import type { ActionResult } from "@/types/api";

// Jenis data yang dikenai tiap aksi; menjadi bagian path API (/reviews/... atau /menus/...).
const TARGET_BY_ACTION: Record<ModerationAction, "reviews" | "menus"> = {
  hide: "reviews",
  unhide: "reviews",
  takedown: "menus",
  restore: "menus",
};
// Aksi yang wajib disertai alasan: sembunyikan ulasan dan turunkan menu.
const ACTIONS_NEEDING_REASON: ModerationAction[] = ["hide", "takedown"];

/**
 * Menjalankan satu aksi moderasi (POST /admin/reviews/:id/:action atau /admin/menus/:id/:action).
 * @param id id ulasan atau menu
 * @param action "hide" / "unhide" (ulasan) atau "takedown" / "restore" (menu)
 * @param rawReason alasan; wajib 1–500 karakter (setelah dirapikan) untuk "hide" dan "takedown", diabaikan untuk aksi lain
 * @returns `{ data }` berisi ulasan atau menu terbaru; `{ error }` bila id/aksi tidak valid, alasan kosong atau terlalu panjang,
 *   atau backend menolak
 */
export async function moderate(
  id: number,
  action: ModerationAction,
  rawReason?: string,
): Promise<ActionResult<ModerationReview | ModerationMenu>> {
  // 1. Wajib admin; id dan aksi harus dikenal.
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0 || !Object.hasOwn(TARGET_BY_ACTION, action))
    return errorResult("VALIDATION_ERROR", "Data moderasi tidak valid.");
  // 2. Aksi yang butuh alasan: cek alasan lalu jadikan isi permintaan; aksi lain tanpa isi.
  let body: string | undefined;
  if (ACTIONS_NEEDING_REASON.includes(action)) {
    const reason = typeof rawReason === "string" ? rawReason.trim() : "";
    if (reason.length < 1 || reason.length > 500)
      return fieldErrorResult({ reason: "Alasan wajib diisi, maksimal 500 karakter." }, "Periksa kembali alasan.");
    body = JSON.stringify({ reason });
  }
  // 3. Kirim ke rute sesuai jenis data.
  return toResult(
    await adminFetch<ModerationReview | ModerationMenu>(`/${TARGET_BY_ACTION[action]}/${id}/${action}`, {
      method: "POST",
      body,
    }),
  );
}

/**
 * Menghapus satu foto menu (utama atau tambahan) tanpa menurunkan menunya (POST /admin/menus/:id/photos/remove).
 * Alasan wajib, sama seperti menurunkan menu.
 * @param id id menu
 * @param url alamat foto yang dihapus (maksimal 500 karakter)
 * @param rawReason alasan 1–500 karakter (setelah dirapikan)
 * @returns `{ data }` berisi menu terbaru; `{ error }` bila id/url tidak valid, alasan kosong atau terlalu panjang, atau backend menolak
 */
export async function deleteMenuPhoto(
  id: number,
  url: string,
  rawReason: string,
): Promise<ActionResult<ModerationMenu>> {
  // 1. Wajib admin; id dan url harus valid.
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0 || typeof url !== "string" || !url || url.length > 500)
    return errorResult("VALIDATION_ERROR", "Data moderasi tidak valid.");
  // 2. Alasan wajib.
  const reason = typeof rawReason === "string" ? rawReason.trim() : "";
  if (reason.length < 1 || reason.length > 500)
    return fieldErrorResult({ reason: "Alasan wajib diisi, maksimal 500 karakter." }, "Periksa kembali alasan.");
  // 3. Kirim ke backend.
  return toResult(
    await adminFetch<ModerationMenu>(`/menus/${id}/photos/remove`, {
      method: "POST",
      body: JSON.stringify({ url, reason }),
    }),
  );
}
