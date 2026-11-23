import "server-only";

// Data halaman admin /admin/ai: daftar penyedia AI dan laporan pemakaiannya.
// Posisi di alur: halaman/actions -> services (file ini) -> api.ts -> backend.

import { adminFetch, toResult } from "@/services/api";
import type { AiProviderList, AiUsage } from "@/types/ai";

/**
 * Mengambil daftar penyedia AI.
 * @returns `{ data }` atau `{ error }`
 */
export const getAiProviders = async () => toResult(await adminFetch<AiProviderList>("/ai-providers"));

/**
 * Mengambil pemakaian AI beberapa hari terakhir.
 * @param days jumlah hari (7 atau 30)
 * @returns `{ data }` atau `{ error }`
 */
export const getAiUsage = async (days: number) => toResult(await adminFetch<AiUsage>(`/ai-usage?days=${days}`));
