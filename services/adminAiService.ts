import "server-only";
import { adminFetch, hasil } from "@/services/api";
import type { DaftarAi, PemakaianAi } from "@/types/ai";

// F22: penyedia AI untuk halaman /admin/ai
export const getPenyediaAi = async () => hasil(await adminFetch<DaftarAi>("/ai-providers"));

// F25: pemakaian `hari` hari terakhir (7 atau 30)
export const getPemakaianAi = async (hari: number) => hasil(await adminFetch<PemakaianAi>(`/ai-usage?days=${hari}`));
