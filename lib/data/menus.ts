import "server-only";
import { hasil } from "../api";
import { merchantFetch } from "../merchant-api";
import { getSkenario } from "../skenario";
import type { DataResult, MerchantMenu } from "../types";

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
