import "server-only";
import { cache } from "react";
import { toResult, merchantFetch } from "@/services/api";
import { toWibClock } from "@/lib/format";
import { getScenario } from "@/lib/scenario";
import type { DataResult } from "@/types/api";
import type { MerchantProfile } from "@/types/profile";

// cache(): layout dan halaman berbagi satu bacaan per permintaan.
// Skenario /pratinjau (hanya dev) ditumpuk di atas data sungguhan agar alur SH/PG tetap bisa dipicu.
export const getProfile = cache(async (): Promise<DataResult<MerchantProfile>> => {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  const result = toResult(await merchantFetch<MerchantProfile>("/profile"));
  if ("error" in result) return result;
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
