// Pembuat alamat halaman dengan query string, dipakai tombol filter dan paginasi.

/**
 * Membuat alamat `path` dari query sekarang yang diubah sebagian.
 * Nilai kosong, null, atau yang tercantum di `emptyValues` menghapus parameter itu dari URL.
 * @param path alamat halaman tanpa query
 * @param current query sekarang
 * @param changes parameter yang diubah
 * @param emptyValues nilai yang dianggap bawaan sehingga tidak perlu ditulis di URL
 * @returns alamat lengkap, mis. "/ulasan?bintang=5"
 */
export function buildUrl(
  path: string,
  current: URLSearchParams | string,
  changes: Record<string, string | null | undefined>,
  emptyValues: string[] = [],
): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value && !emptyValues.includes(value)) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
