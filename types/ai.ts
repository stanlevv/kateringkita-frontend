// Bentuk data penyedia AI dan pemakaiannya dari backend (/admin/ai-providers, /admin/ai-usage).
// API key tidak pernah dikirim balik oleh backend; yang ada hanya `key_hint` (beberapa huruf terakhir).

/** Jenis layanan AI yang didukung. */
export type AiProviderType = "gemini" | "groq" | "openrouter" | "nvidia";

/**
 * Satu penyedia AI yang tersimpan, termasuk kapan terakhir berhasil/gagal dan sampai kapan sedang diistirahatkan.
 */
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

/** Daftar penyedia AI ditambah model Gemini cadangan dari pengaturan server (bila ada). */
export type AiProviderList = { providers: AiProvider[]; env_gemini: { model: string } | null };

/** Isian form tambah/ubah penyedia AI yang dikirim ke backend. */
export type AiProviderInput = {
  provider: AiProviderType;
  label: string;
  model: string;
  api_key: string;
  priority: number;
  is_active: boolean;
};

/**
 * Hasil tombol "Uji" penyedia AI: berhasil (waktu respons dan contoh jawaban) atau gagal (pesan galat).
 */
export type AiTestResult = { ok: true; ms: number; sample: string } | { ok: false; message: string };

/** Fitur yang memakai AI: asisten penjual, rekomendasi menu, atau uji koneksi. */
export type AiFeature = "asisten" | "rekomendasi" | "uji";
type UsageCounts = { panggilan: number; gagal: number; token: number };

/**
 * Laporan pemakaian AI beberapa hari terakhir: ringkasan, per penyedia, per fitur, per hari, dan kegagalan terakhir.
 */
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
