// Tipe umum untuk semua jawaban API dan server action (lihat docs/API.md).
// Uang selalu bilangan bulat rupiah; waktu selalu teks ISO-8601 UTC.

/** Bentuk galat dari backend: kode mesin, pesan untuk pengguna, dan pesan per field bila ada. */
export type ApiError = { code: string; message: string; fields?: Record<string, string[]> };
/**
 * Hasil baca data dari service: `{ data }` (bisa dengan `meta` halaman) bila berhasil, atau `{ error }`.
 */
export type DataResult<T> = { data: T; meta?: { page: number; limit: number; total: number } } | { error: ApiError };
/** Hasil server action: `{ data }` bila berhasil atau `{ error }` bila gagal. */
export type ActionResult<T> = { data: T } | { error: ApiError };
