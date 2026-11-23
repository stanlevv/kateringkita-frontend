import "server-only";
import { adminFetch, toResult } from "@/services/api";
import type { AiProviderList, AiUsage } from "@/types/ai";

// F22: penyedia AI untuk halaman /admin/ai
export const getAiProviders = async () => toResult(await adminFetch<AiProviderList>("/ai-providers"));

// F25: pemakaian `hari` hari terakhir (7 atau 30)
export const getAiUsage = async (days: number) => toResult(await adminFetch<AiUsage>(`/ai-usage?days=${days}`));
