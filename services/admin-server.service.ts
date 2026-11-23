import "server-only";

// Data dashboard server untuk admin: status kesehatan dan log galat/lambat.
// Posisi di alur: halaman/actions -> services (file ini) -> api.ts -> backend.

import { adminFetch, toResult } from "@/services/api";
import type { ServerLog, ServerStatus } from "@/types/server";

/** Jumlah log server per halaman. */
export const LIMIT_SERVER_LOGS = 20;

/**
 * Mengambil status kesehatan server.
 * @returns `{ data }` atau `{ error }`
 */
export const getServerStatus = async () => toResult(await adminFetch<ServerStatus>("/server-status"));

/**
 * Mengambil log server dengan penyaring dari URL.
 * @param query parameter penyaring dan halaman
 * @returns hasil mentah `ApiResult` (termasuk `meta` paginasi)
 */
export const getServerLogs = (query: URLSearchParams) => adminFetch<ServerLog[]>(`/server-logs?${query}`);
