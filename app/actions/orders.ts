"use server";

// Server action aksi pesanan penjual: konfirmasi, mulai masak, siap, selesai, atau tolak.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult } from "@/lib/action-result";
import { toResult, merchantFetch } from "@/services/api";
import { actionTexts, type OrderAction } from "@/lib/order-status";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";
import type { MerchantOrder } from "@/types/order";

/**
 * Menjalankan satu aksi pada pesanan (POST /merchant/orders/:code/:action).
 * Klien hanya mengirim nama aksi; status baru selalu diputuskan backend, jadi status lama dari layar tidak ikut dikirim.
 * Skenario pratinjau (/pratinjau, hanya mode pengembangan) bisa memaksa gagal, status sudah berubah, atau stok bentrok.
 * @param code kode pesanan
 * @param action "confirm" | "cook" | "ready" | "complete" | "reject"
 * @param reason alasan penolakan; wajib (tidak boleh kosong) bila action "reject"
 * @returns `{ data }` berisi pesanan terbaru; `{ error }` bila data tidak valid, alasan tolak kosong,
 *   atau backend menolak (mis. 409 pesanan sudah berubah status, 404 tidak ditemukan)
 */
export async function orderAction(
  code: string,
  action: OrderAction,
  reason?: string,
): Promise<ActionResult<MerchantOrder>> {
  // 1. Wajib login penjual; kode harus teks dan aksi harus dikenal.
  await requireMerchant();
  if (typeof code !== "string" || !Object.hasOwn(actionTexts, action))
    return errorResult("VALIDATION_ERROR", "Data pesanan tidak valid.");
  // 2. Skenario pratinjau bisa memaksa hasil gagal tanpa memanggil backend.
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Gagal memproses pesanan. Coba lagi.");
  if (scenario === "status-berubah") return errorResult("CONFLICT", "Pesanan sudah berubah status.");
  if (scenario === "stok-bentrok" && action === "confirm")
    return errorResult("OUT_OF_STOCK", "Stok tidak cukup untuk pesanan ini.");
  // 3. Tolak wajib beralasan; alasan hanya dikirim untuk aksi tolak.
  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (action === "reject" && !trimmedReason) return errorResult("VALIDATION_ERROR", "Pilih alasan penolakan.");
  return toResult(
    await merchantFetch<MerchantOrder>(`/orders/${encodeURIComponent(code)}/${action}`, {
      method: "POST",
      body: JSON.stringify(action === "reject" ? { reason: trimmedReason } : {}),
    }),
  );
}
