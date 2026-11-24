import "server-only";

// Katalog publik tanpa login (GET /merchants, /merchants/:slug, /menus?merchant=) untuk halaman /toko.
// Posisi di alur: halaman -> services (file ini) -> api.ts -> backend. Tanpa mode demo (getScenario).

import { apiFetch, toResult } from "@/services/api";
import type { MenuCard, MerchantProfile, PublicMerchantSummary } from "@/types/catalog";
import type { DataResult } from "@/types/api";

/**
 * Mengambil daftar toko yang tampil di publik (urut nama, tanpa paginasi).
 * @param pickupPointId bila diisi, hanya toko yang melayani titik ambil ini
 * @returns `{ data }` atau `{ error }`
 */
export async function getPublicMerchants(pickupPointId?: number): Promise<DataResult<PublicMerchantSummary[]>> {
  const query = pickupPointId === undefined ? "" : `?pickup_point_id=${pickupPointId}`;
  return toResult(await apiFetch<PublicMerchantSummary[]>(`/merchants${query}`));
}

/**
 * Mengambil profil satu toko berdasarkan slug.
 * @param slug slug toko
 * @returns `{ data }`, atau `{ error }` (404 NOT_FOUND bila toko tidak tampil)
 */
export async function getMerchantBySlug(slug: string): Promise<DataResult<MerchantProfile>> {
  return toResult(await apiFetch<MerchantProfile>(`/merchants/${encodeURIComponent(slug)}`));
}

/**
 * Mengambil menu satu toko (default maks 100; menu toko tutup tetap ikut).
 * @param slug slug toko
 * @param limit batas jumlah menu
 * @returns `{ data }` berupa daftar `MenuCard` (tanpa `meta`), atau `{ error }`
 */
export async function getMerchantMenus(slug: string, limit = 100): Promise<DataResult<MenuCard[]>> {
  return toResult(await apiFetch<MenuCard[]>(`/menus?merchant=${encodeURIComponent(slug)}&limit=${limit}`));
}
