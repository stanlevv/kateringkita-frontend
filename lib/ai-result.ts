// Tab dan batas per halaman untuk halaman admin "Verifikasi AI".
// Sengaja bukan modul "use client": halaman server (page.tsx) memanggil `parseAiResultTab`,
// sedangkan ekspor dari modul client hanya berupa referensi bila dipakai di server.

/** Jumlah hasil AI per halaman. */
export const LIMIT_AI_RESULTS = 20;
/** Tab penyaring di halaman Verifikasi AI. */
export const AI_RESULT_TABS = [
  { id: "menunggu", label: "Menunggu" },
  { id: "disetujui", label: "Disetujui" },
  { id: "ditolak", label: "Ditolak" },
  { id: "semua", label: "Semua" },
] as const;
/** Id tab yang sah. */
export type AiResultTab = (typeof AI_RESULT_TABS)[number]["id"];
/**
 * Membaca tab dari URL dengan aman.
 * @param value nilai mentah dari searchParams
 * @returns id tab yang sah, atau "menunggu" bila nilainya tidak dikenal
 */
export const parseAiResultTab = (value: unknown): AiResultTab =>
  AI_RESULT_TABS.some((tab) => tab.id === value) ? (value as AiResultTab) : "menunggu";
