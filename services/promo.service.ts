import "server-only";
import { toResult, merchantFetch } from "@/services/api";
import { getScenario } from "@/lib/scenario";
import type { DataResult } from "@/types/api";
import type { Promo } from "@/types/promo";

// F12: GET /merchant/promos; skenario /pratinjau (dev) ditumpuk seperti getMenus
export async function getPromos(): Promise<DataResult<Promo[]>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: [] };
  return toResult(await merchantFetch<Promo[]>("/promos"));
}
