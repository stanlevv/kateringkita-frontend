// Util halaman area titik ambil (/area/<id>-<nama>): slug, parsing id, dan ambang konten.

/** Jumlah toko minimal agar halaman area diindeks mesin pencari (di bawahnya noindex). */
export const AREA_MIN_STORES = 2;

/**
 * Slug area `<id>-<nama>`; aturan slug sama dengan `slugify` di backend.
 * @param point id dan nama titik ambil
 * @returns mis. `"1-gedung-vokasi-ub-lt-2"`
 */
export function areaSlug(point: { id: number; name: string }): string {
  return `${point.id}-${point.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

/**
 * Mengambil id titik ambil dari param rute (`"3-gazebo"` atau `"3"`).
 * @param param segmen `[slug]` dari URL
 * @returns id (>= 1, maks 9 digit), atau `null` bila bentuknya tidak valid
 */
export function parseAreaId(param: string): number | null {
  const slugMatch = /^(\d{1,9})(?:-|$)/.exec(param);
  const id = slugMatch ? Number(slugMatch[1]) : 0;
  return id >= 1 ? id : null;
}
