// F22 AI gateway (kontrak backend: /admin/ai-providers). API key tidak pernah dikirim balik, hanya key_hint.
export type JenisAi = "gemini" | "groq" | "openrouter" | "nvidia";

export type PenyediaAi = {
  id: number;
  provider: JenisAi;
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

export type DaftarAi = { providers: PenyediaAi[]; env_gemini: { model: string } | null };

export type IsianAi = { provider: JenisAi; label: string; model: string; api_key: string; priority: number; is_active: boolean };

export type HasilUjiAi = { ok: true; ms: number; sample: string } | { ok: false; message: string };

// F25 pemakaian AI (kontrak backend: GET /admin/ai-usage?days=)
export type FiturAi = "asisten" | "rekomendasi" | "uji";
type Hitung = { panggilan: number; gagal: number; token: number };

export type PemakaianAi = {
  hari: number;
  ringkas: Hitung & { token_masuk: number; token_keluar: number; rata_ms: number | null };
  per_penyedia: (Hitung & { provider_id: number | null; provider: JenisAi; label: string; model: string; rata_ms: number | null; terakhir: string })[];
  per_fitur: (Hitung & { fitur: FiturAi })[];
  per_hari: (Hitung & { tanggal: string })[];
  gagal_terakhir: { created_at: string; label: string; model: string; fitur: FiturAi; error: string | null }[];
};
