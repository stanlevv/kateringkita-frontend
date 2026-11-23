"use server";

// Server action buka/tutup dapur (toko) penjual lewat PATCH /merchant/status.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur: halaman/form -> server action (file ini) -> services/api.ts -> backend.

import { toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";

/**
 * Membuka atau menutup dapur; saat tutup pembeli tidak bisa memesan.
 * Skenario pratinjau (/pratinjau, hanya mode pengembangan) "gagal-aksi" memaksa gagal tanpa memanggil backend.
 * @param isOpen true = buka
 * @returns `{ data: { is_open } }` dari backend; `{ error }` bila skenario gagal atau backend menolak
 */
export async function setStoreOpen(isOpen: boolean): Promise<ActionResult<{ is_open: boolean }>> {
  await requireMerchant();
  if ((await getScenario()) === "gagal-aksi") {
    return { error: { code: "INTERNAL_ERROR", message: "Status dapur belum berubah. Coba lagi." } };
  }
  return toResult(
    await merchantFetch<{ is_open: boolean }>("/status", {
      method: "PATCH",
      body: JSON.stringify({ is_open: isOpen }),
    }),
  );
}
