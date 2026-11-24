import "server-only";

// Data ulasan pembeli dari backend (GET /merchant/reviews).
// Posisi di alur: halaman (baca data) atau server action (ubah data) -> services (file ini) -> api.ts -> backend.

import { toResult, merchantFetch } from "@/services/api";
import { getScenario } from "@/lib/scenario";
import type { DataResult } from "@/types/api";
import type { Review } from "@/types/review";

/**
 * Mengambil semua ulasan untuk toko penjual. Skenario /pratinjau bisa memaksa kosong atau gagal.
 * @returns `{ data }` atau `{ error }`
 */
export async function getReviews(): Promise<DataResult<Review[]>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: [] };
  return toResult(await merchantFetch<Review[]>("/reviews"));
}
