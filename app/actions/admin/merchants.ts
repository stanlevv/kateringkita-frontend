"use server";

// Server action admin untuk mengubah status penjual: verifikasi, minta perbaikan, tangguhkan, aktifkan lagi, atau tutup hari ini.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { MerchantAction } from "@/types/admin";
import type { ActionResult } from "@/types/api";

// Aksi yang wajib disertai alasan: minta perbaikan dan tangguhkan.
const ACTIONS_NEEDING_REASON: MerchantAction[] = ["request-fix", "suspend"];
const ALL_ACTIONS: MerchantAction[] = [...ACTIONS_NEEDING_REASON, "verify", "reactivate", "close-today"];

/**
 * Menjalankan satu aksi status pada penjual (POST /admin/merchants/:id/:action). Boleh atau tidaknya perpindahan status diputuskan backend.
 * @param id id penjual
 * @param action "verify" | "request-fix" | "suspend" | "reactivate" | "close-today"
 * @param rawReason alasan; wajib 1–500 karakter (setelah dirapikan) untuk "request-fix" dan "suspend", diabaikan untuk aksi lain
 * @returns `{ data: null }` bila berhasil; `{ error }` bila id/aksi tidak valid, alasan kosong atau terlalu panjang,
 *   atau backend menolak (mis. 409 status penjual sudah berubah)
 */
export async function applyMerchantAction(
  id: number,
  action: MerchantAction,
  rawReason?: string,
): Promise<ActionResult<null>> {
  // 1. Wajib admin; id dan aksi harus dikenal.
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0 || !ALL_ACTIONS.includes(action))
    return errorResult("VALIDATION_ERROR", "Data penjual tidak valid.");
  // 2. Aksi yang butuh alasan: cek alasan lalu jadikan isi permintaan; aksi lain tanpa isi.
  let body: string | undefined;
  if (ACTIONS_NEEDING_REASON.includes(action)) {
    const reason = typeof rawReason === "string" ? rawReason.trim() : "";
    if (reason.length < 1 || reason.length > 500)
      return fieldErrorResult({ reason: "Alasan wajib diisi, maksimal 500 karakter." }, "Periksa kembali alasan.");
    body = JSON.stringify({ reason });
  }
  // 3. Kirim ke backend.
  const response = await adminFetch<null>(`/merchants/${id}/${action}`, { method: "POST", body });
  return response.ok ? { data: null } : toResult(response);
}
