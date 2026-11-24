// Informasi penyedia AI untuk halaman admin /admin/ai: tempat membuat API key, contoh model, dan status siap pakai.

import type { AiProviderType } from "@/types/ai";

/**
 * Data tiap jenis penyedia AI: nama, alamat untuk membuat API key gratis, dan contoh nama model.
 * Nama model bisa berubah dari waktu ke waktu, jadi admin tetap bebas mengetik nama model sendiri.
 */
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
/** Daftar semua jenis penyedia AI, urut seperti di `AI_PROVIDER_INFO`. */
export const AI_PROVIDER_TYPES = Object.keys(AI_PROVIDER_INFO) as AiProviderType[];

/**
 * Menentukan status penyedia AI untuk ditampilkan: nonaktif, sedang istirahat, atau siap.
 * Penyedia diistirahatkan sementara oleh backend setelah gagal berulang.
 * @param provider data penyedia (cukup `is_active` dan `cooldown_until`)
 * @param now waktu sekarang dalam milidetik; bisa diisi saat test
 * @returns `{ kind: "nonaktif" }`, `{ kind: "istirahat", until }`, atau `{ kind: "siap" }`
 */
export function aiProviderStatus(provider: { is_active: boolean; cooldown_until: string | null }, now = Date.now()) {
  if (!provider.is_active) return { kind: "nonaktif" as const };
  if (provider.cooldown_until && Date.parse(provider.cooldown_until) > now)
    return { kind: "istirahat" as const, until: provider.cooldown_until };
  return { kind: "siap" as const };
}
