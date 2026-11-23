import "server-only";
import { hasil, merchantFetch } from "@/services/api";
import { getSkenario } from "@/lib/skenario";
import type { DataResult } from "@/types/api";
import type { Promo } from "@/types/promo";

// F12: GET /merchant/promos; skenario /pratinjau (dev) ditumpuk seperti getMenus
export async function getPromos(): Promise<DataResult<Promo[]>> {
  const s = await getSkenario();
  if (s === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (s === "kosong" || s === "penjual-baru") return { data: [] };
  return hasil(await merchantFetch<Promo[]>("/promos"));
}
