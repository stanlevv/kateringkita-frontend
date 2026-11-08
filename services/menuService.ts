import "server-only";
import { hasil, merchantFetch } from "@/services/api";
import { getSkenario } from "@/lib/skenario";
import type { DataResult } from "@/types/api";
import type { MerchantMenu } from "@/types/menu";

// Skenario /pratinjau (hanya dev) ditumpuk di atas data sungguhan (F04 D18).
export async function getMenus(): Promise<DataResult<MerchantMenu[]>> {
  const s = await getSkenario();
  if (s === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (s === "kosong" || s === "penjual-baru") return { data: [] };
  return hasil(await merchantFetch<MerchantMenu[]>("/menus"));
}

export async function getMenu(id: number): Promise<DataResult<MerchantMenu>> {
  return hasil(await merchantFetch<MerchantMenu>(`/menus/${id}`));
}
