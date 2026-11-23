import "server-only";
import { apiFetch, toResult } from "@/services/api";
import { getScenario } from "@/lib/scenario";
import type { Category, PickupPoint, Maintenance } from "@/types/meta";
import type { DataResult } from "@/types/api";

export async function getCategories(): Promise<DataResult<Category[]>> {
  if ((await getScenario()) === "gagal-muat")
    return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  return toResult(await apiFetch<Category[]>("/meta/categories"));
}

export async function getPickupPoints(): Promise<DataResult<PickupPoint[]>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "penjual-baru") return { data: [] };
  return toResult(await apiFetch<PickupPoint[]>("/meta/pickup-points"));
}

// F27: status mode pemeliharaan dari GET /meta/settings; backend tak terjangkau -> dianggap mati (halaman lain menangani galatnya)
export async function getMaintenance(): Promise<Maintenance> {
  const response = await apiFetch<{ maintenance?: Maintenance }>("/meta/settings");
  return response.data?.maintenance ?? { aktif: false, pesan: null };
}
