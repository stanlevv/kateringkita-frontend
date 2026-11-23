// Bukan modul "use client": page.tsx (server) memanggil tabHasilAi; ekspor dari modul client hanya referensi di server
export const LIMIT_AI_RESULTS = 20;
export const AI_RESULT_TABS = [
  { id: "menunggu", label: "Menunggu" },
  { id: "disetujui", label: "Disetujui" },
  { id: "ditolak", label: "Ditolak" },
  { id: "semua", label: "Semua" },
] as const;
export type AiResultTab = (typeof AI_RESULT_TABS)[number]["id"];
export const parseAiResultTab = (value: unknown): AiResultTab =>
  AI_RESULT_TABS.some((tab) => tab.id === value) ? (value as AiResultTab) : "menunggu";
