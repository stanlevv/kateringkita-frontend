// Tipe disalin dari docs/API.md (§1, §7). Uang = integer Rupiah, waktu = ISO-8601 UTC.

export type ApiError = { code: string; message: string; fields?: Record<string, string[]> };
export type DataResult<T> =
  | { data: T; meta?: { page: number; limit: number; total: number } }
  | { error: ApiError };
export type ActionResult<T> = { data: T } | { error: ApiError };
