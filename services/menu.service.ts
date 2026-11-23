import "server-only";

// Data menu penjual dari backend (GET /merchant/menus).
// Skenario /pratinjau (hanya mode pengembangan) bisa memaksa hasil kosong atau gagal tanpa memanggil backend.
// Posisi di alur: halaman/actions -> services (file ini) -> api.ts -> backend.

import { toResult, merchantFetch } from "@/services/api";
import { getScenario } from "@/lib/scenario";
import type { DataResult } from "@/types/api";
import type { MerchantMenu } from "@/types/menu";

/**
 * Mengambil semua menu penjual.
 * @returns `{ data }` atau `{ error }`
 */
export async function getMenus(): Promise<DataResult<MerchantMenu[]>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: [] };
  return toResult(await merchantFetch<MerchantMenu[]>("/menus"));
}

/**
 * Mengambil satu menu.
 * @param id id menu
 * @returns `{ data }` atau `{ error }` (mis. NOT_FOUND)
 */
export async function getMenu(id: number): Promise<DataResult<MerchantMenu>> {
  return toResult(await merchantFetch<MerchantMenu>(`/menus/${id}`));
}
