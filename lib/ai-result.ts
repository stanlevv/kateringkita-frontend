// Bukan modul "use client": page.tsx (server) memanggil tabHasilAi; ekspor dari modul client hanya referensi di server
export const LIMIT_HASIL_AI = 20;
export const TAB_HASIL_AI = [
  { id: "menunggu", label: "Menunggu" },
  { id: "disetujui", label: "Disetujui" },
  { id: "ditolak", label: "Ditolak" },
  { id: "semua", label: "Semua" },
] as const;
export type TabHasilAi = (typeof TAB_HASIL_AI)[number]["id"];
export const tabHasilAi = (v: unknown): TabHasilAi =>
  TAB_HASIL_AI.some((t) => t.id === v) ? (v as TabHasilAi) : "menunggu";
