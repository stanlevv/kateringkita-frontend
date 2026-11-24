import "server-only";

// Data profil toko penjual dari backend (GET /merchant/profile).
// Posisi di alur: halaman (baca data) atau server action (ubah data) -> services (file ini) -> api.ts -> backend.

import { cache } from "react";
import { toResult, merchantFetch } from "@/services/api";
import { toWibClock } from "@/lib/format";
import { getScenario } from "@/lib/scenario";
import type { DataResult } from "@/types/api";
import type { MerchantProfile } from "@/types/profile";

/**
 * Mengambil profil toko. Dibungkus `cache()` agar layout dan halaman berbagi satu bacaan per permintaan.
 * Skenario /pratinjau (hanya mode pengembangan) bisa mengubah hasilnya (dapur tutup, penjual baru, di luar jam buka).
 * @returns `{ data }` atau `{ error }`
 */
export const getProfile = cache(async (): Promise<DataResult<MerchantProfile>> => {
  // 1. Skenario pratinjau bisa memaksa gagal atau kosong tanpa memanggil backend.
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  // 2. Ambil profil dari backend.
  const result = toResult(await merchantFetch<MerchantProfile>("/profile"));
  if ("error" in result) return result;
  // 3. Ubah salinan profil sesuai skenario pratinjau (dapur tutup, penjual baru, di luar jam buka).
  const profile = { ...result.data };
  if (scenario === "dapur-tutup") profile.is_open = false;
  if (scenario === "penjual-baru") profile.pickup_point_ids = [];
  if (scenario === "luar-jam") {
    // Jam sekarang di WIB; pilih rentang buka yang pasti tidak memuat sekarang.
    const hour = toWibClock(Date.now()).getUTCHours();
    [profile.open_time, profile.close_time] = hour < 12 ? ["13:00", "16:00"] : ["06:00", "08:00"];
  }
  return { data: profile };
});
