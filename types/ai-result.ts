// Rubrik AI: hasil AI tersimpan (GET /admin/hasil-ai) untuk verifikasi manual
export type AiResultStatus = "menunggu" | "disetujui" | "ditolak";
export type AiResultFeature = "asisten" | "rekomendasi";

export type AssistantOutput = { jawaban: string; poin: string[]; asumsi: string };
export type RecommendationItem = {
  menu_id: number;
  menu: string;
  toko: string;
  qty: number;
  subtotal: number;
  reason: string | null;
};
export type RecommendationOutput = { summary: string; total: number; items: RecommendationItem[] };

type Person = { id: number; name: string };

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

/** Jawaban POST /merchant/assistant: jawaban + poin + asumsi (keluaran AI tervalidasi). */
export type AssistantAnswer = { answer: string; points: string[]; assumption: string | null; result_id: number | null };
