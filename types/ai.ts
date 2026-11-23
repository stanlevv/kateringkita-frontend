// F22 AI gateway (kontrak backend: /admin/ai-providers). API key tidak pernah dikirim balik, hanya key_hint.
export type AiProviderType = "gemini" | "groq" | "openrouter" | "nvidia";

export type AiProvider = {
  id: number;
  provider: AiProviderType;
  provider_name: string;
  label: string;
  model: string;
  key_hint: string;
  priority: number;
  is_active: boolean;
  last_ok_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  cooldown_until: string | null;
};

export type AiProviderList = { providers: AiProvider[]; env_gemini: { model: string } | null };

export type AiProviderInput = {
  provider: AiProviderType;
  label: string;
  model: string;
  api_key: string;
  priority: number;
  is_active: boolean;
};

export type AiTestResult = { ok: true; ms: number; sample: string } | { ok: false; message: string };

// F25 pemakaian AI (kontrak backend: GET /admin/ai-usage?days=)
export type AiFeature = "asisten" | "rekomendasi" | "uji";
type UsageCounts = { panggilan: number; gagal: number; token: number };

export type AiUsage = {
  hari: number;
  ringkas: UsageCounts & { token_masuk: number; token_keluar: number; rata_ms: number | null };
  per_penyedia: (UsageCounts & {
    provider_id: number | null;
    provider: AiProviderType;
    label: string;
    model: string;
    rata_ms: number | null;
    terakhir: string;
  })[];
  per_fitur: (UsageCounts & { fitur: AiFeature })[];
  per_hari: (UsageCounts & { tanggal: string })[];
  gagal_terakhir: { created_at: string; label: string; model: string; fitur: AiFeature; error: string | null }[];
};
