import "server-only";
import { toResult, merchantFetch } from "@/services/api";
import { getScenario } from "@/lib/scenario";
import type { DataResult } from "@/types/api";
import type { MerchantMenu } from "@/types/menu";

// Skenario /pratinjau (hanya dev) ditumpuk di atas data sungguhan (F04 D18).
export async function getMenus(): Promise<DataResult<MerchantMenu[]>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: [] };
  return toResult(await merchantFetch<MerchantMenu[]>("/menus"));
}

export async function getMenu(id: number): Promise<DataResult<MerchantMenu>> {
  return toResult(await merchantFetch<MerchantMenu>(`/menus/${id}`));
}
