// Pembuat hasil galat untuk server action (fungsi di app/actions yang dijalankan di server saat form dikirim).
// Bentuknya sama dengan galat dari backend, jadi komponen cukup menangani satu bentuk.

import type { ApiError } from "@/types/api";

/**
 * Membuat hasil galat `{ error }` dengan kode dan pesan tertentu.
 * @param code kode mesin, mis. "VALIDATION_ERROR"
 * @param message pesan untuk pengguna
 * @returns objek `{ error: { code, message } }`
 */
export const errorResult = (code: string, message: string): { error: ApiError } => ({ error: { code, message } });

/**
 * Membuat galat validasi dengan satu pesan per field form.
 * @param map pasangan nama field -> pesan galat
 * @param message pesan umum di atas form
 * @returns objek `{ error }` berkode "VALIDATION_ERROR" dengan `fields` berisi pesan per field
 */
export const fieldErrorResult = (map: Record<string, string>, message: string): { error: ApiError } => ({
  error: {
    code: "VALIDATION_ERROR",
    message,
    fields: Object.fromEntries(Object.entries(map).map(([field, fieldMessage]) => [field, [fieldMessage]])),
  },
});
