import "server-only";

// Data fitur pesan dari meja: daftar meja toko (untuk penjual) dan menu meja (publik, tanpa login).
// Posisi di alur: halaman (baca data) atau server action (ubah data) -> services (file ini) -> api.ts -> backend.

import { apiFetch, toResult, merchantFetch } from "@/services/api";
import type { Table, TableMenu } from "@/types/table";

/**
 * Mengambil daftar meja milik penjual.
 * @returns `{ data }` atau `{ error }`
 */
export const getTables = async () => toResult(await merchantFetch<Table[]>("/tables"));

/**
 * Mengambil isi halaman pesan dari meja berdasarkan token di QR (tanpa login).
 * @param token token meja
 * @returns hasil mentah `ApiResult`
 */
export const getTableMenu = (token: string) => apiFetch<TableMenu>(`/tables/${encodeURIComponent(token)}`);
