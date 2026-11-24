import "server-only";

// Data promo/voucher penjual dari backend (GET /merchant/promos).
// Posisi di alur: halaman (baca data) atau server action (ubah data) -> services (file ini) -> api.ts -> backend.

import { toResult, merchantFetch } from "@/services/api";
import { getScenario } from "@/lib/scenario";
import type { DataResult } from "@/types/api";
import type { Promo } from "@/types/promo";

/**
 * Mengambil semua voucher milik penjual. Skenario /pratinjau bisa memaksa kosong atau gagal.
 * @returns `{ data }` atau `{ error }`
 */
export async function getPromos(): Promise<DataResult<Promo[]>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: [] };
  return toResult(await merchantFetch<Promo[]>("/promos"));
}
