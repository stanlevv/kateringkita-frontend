import "server-only";
import { adminFetch, hasil } from "@/services/api";
import type { DaftarAi } from "@/types/ai";

// F22: penyedia AI untuk halaman /admin/ai
export const getPenyediaAi = async () => hasil(await adminFetch<DaftarAi>("/ai-providers"));
