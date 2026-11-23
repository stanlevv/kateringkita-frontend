// Bentuk data hasil AI yang tersimpan (GET /admin/hasil-ai) agar admin bisa memeriksa dan menyetujuinya.
// Nama properti mengikuti JSON dari backend.

/** Status pemeriksaan hasil AI oleh admin. */
export type AiResultStatus = "menunggu" | "disetujui" | "ditolak";
/** Fitur asal hasil AI: asisten penjual atau rekomendasi menu. */
export type AiResultFeature = "asisten" | "rekomendasi";

/** Isi jawaban asisten yang tersimpan: jawaban, poin-poin, dan asumsi. */
export type AssistantOutput = { jawaban: string; poin: string[]; asumsi: string };
/** Satu menu yang direkomendasikan AI beserta tokonya, jumlah, dan alasannya. */
export type RecommendationItem = {
  menu_id: number;
  menu: string;
  toko: string;
  qty: number;
  subtotal: number;
  reason: string | null;
};
/** Isi rekomendasi menu yang tersimpan: ringkasan, total harga, dan daftar menu. */
export type RecommendationOutput = { summary: string; total: number; items: RecommendationItem[] };

type Person = { id: number; name: string };

/** Satu hasil AI tersimpan beserta status pemeriksaan, catatan admin, dan siapa yang memeriksa. */
export type AiResult = {
  id: number;
  fitur: AiResultFeature;
  input_text: string;
  output: AssistantOutput | RecommendationOutput;
  status: AiResultStatus;
  catatan: string | null;
  created_at: string;
  verified_at: string | null;
  verified_by: Person | null;
  user: Person | null;
  merchant: { id: number; business_name: string } | null;
};

/**
 * Jawaban POST /merchant/assistant yang sudah divalidasi backend: jawaban, poin, asumsi, dan id hasil tersimpan.
 */
export type AssistantAnswer = { answer: string; points: string[]; assumption: string | null; result_id: number | null };
