import "server-only";

// Data pendukung umum dari backend (GET /meta/...): kategori, titik temu, dan status mode pemeliharaan.
// Posisi di alur: halaman/actions -> services (file ini) -> api.ts -> backend.

import { apiFetch, toResult } from "@/services/api";
import { getScenario } from "@/lib/scenario";
import type { Category, PickupPoint, Maintenance } from "@/types/meta";
import type { DataResult } from "@/types/api";

/**
 * Mengambil daftar kategori menu (tanpa login).
 * @returns `{ data }` atau `{ error }`
 */
export async function getCategories(): Promise<DataResult<Category[]>> {
  if ((await getScenario()) === "gagal-muat")
    return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  return toResult(await apiFetch<Category[]>("/meta/categories"));
}

/**
 * Mengambil daftar titik temu (tanpa login).
 * @returns `{ data }` atau `{ error }`
 */
export async function getPickupPoints(): Promise<DataResult<PickupPoint[]>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "penjual-baru") return { data: [] };
  return toResult(await apiFetch<PickupPoint[]>("/meta/pickup-points"));
}

/**
 * Mengambil status mode pemeliharaan dari GET /meta/settings.
 * Bila backend tidak terjangkau, dianggap tidak aktif; halaman lain yang akan menampilkan galatnya.
 * @returns `{ aktif, pesan }`
 */
export async function getMaintenance(): Promise<Maintenance> {
  const response = await apiFetch<{ maintenance?: Maintenance }>("/meta/settings");
  return response.data?.maintenance ?? { aktif: false, pesan: null };
}
