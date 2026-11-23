import type { AiProviderType } from "@/types/ai";

/** F22: tiap jenis penyedia AI — tempat membuat key gratis & contoh model (nama model bisa berubah; admin bebas mengetik). */
export const AI_PROVIDER_INFO: Record<AiProviderType, { name: string; keyUrl: string; exampleModels: string[] }> = {
  gemini: {
    name: "Google Gemini (AI Studio)",
    keyUrl: "https://aistudio.google.com/apikey",
    exampleModels: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
  },
  groq: {
    name: "Groq",
    keyUrl: "https://console.groq.com/keys",
    exampleModels: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  },
  openrouter: {
    name: "OpenRouter",
    keyUrl: "https://openrouter.ai/settings/keys",
    exampleModels: ["meta-llama/llama-3.3-70b-instruct:free"],
  },
  nvidia: { name: "NVIDIA NIM", keyUrl: "https://build.nvidia.com", exampleModels: ["meta/llama-3.3-70b-instruct"] },
};
export const AI_PROVIDER_TYPES = Object.keys(AI_PROVIDER_INFO) as AiProviderType[];

/** Status siap pakai untuk tampilan: nonaktif, istirahat (sampai jam), atau siap. */
export function aiProviderStatus(provider: { is_active: boolean; cooldown_until: string | null }, now = Date.now()) {
  if (!provider.is_active) return { kind: "nonaktif" as const };
  if (provider.cooldown_until && Date.parse(provider.cooldown_until) > now)
    return { kind: "istirahat" as const, until: provider.cooldown_until };
  return { kind: "siap" as const };
}
