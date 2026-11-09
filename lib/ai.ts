import type { JenisAi } from "@/types/ai";

/** F22: tiap jenis penyedia AI — tempat membuat key gratis & contoh model (nama model bisa berubah; admin bebas mengetik). */
export const INFO_AI: Record<JenisAi, { nama: string; kunci: string; contoh: string[] }> = {
  gemini: { nama: "Google Gemini (AI Studio)", kunci: "https://aistudio.google.com/apikey", contoh: ["gemini-2.5-flash", "gemini-2.5-flash-lite"] },
  groq: { nama: "Groq", kunci: "https://console.groq.com/keys", contoh: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] },
  openrouter: { nama: "OpenRouter", kunci: "https://openrouter.ai/settings/keys", contoh: ["meta-llama/llama-3.3-70b-instruct:free"] },
  nvidia: { nama: "NVIDIA NIM", kunci: "https://build.nvidia.com", contoh: ["meta/llama-3.3-70b-instruct"] },
};
export const JENIS_AI = Object.keys(INFO_AI) as JenisAi[];

/** Status siap pakai untuk tampilan: nonaktif, istirahat (sampai jam), atau siap. */
export function statusAi(p: { is_active: boolean; cooldown_until: string | null }, kini = Date.now()) {
  if (!p.is_active) return { jenis: "nonaktif" as const };
  if (p.cooldown_until && Date.parse(p.cooldown_until) > kini) return { jenis: "istirahat" as const, sampai: p.cooldown_until };
  return { jenis: "siap" as const };
}
