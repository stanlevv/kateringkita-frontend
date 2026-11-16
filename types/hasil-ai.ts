// Rubrik AI: hasil AI tersimpan (GET /admin/hasil-ai) untuk verifikasi manual
export type StatusHasilAi = "menunggu" | "disetujui" | "ditolak";
export type FiturHasilAi = "asisten" | "rekomendasi";

export type KeluaranAsisten = { jawaban: string; poin: string[]; asumsi: string };
export type ItemRekomendasi = { menu_id: number; menu: string; toko: string; qty: number; subtotal: number; reason: string | null };
export type KeluaranRekomendasi = { summary: string; total: number; items: ItemRekomendasi[] };

type Orang = { id: number; name: string };

export type HasilAi = {
  id: number;
  fitur: FiturHasilAi;
  input_text: string;
  output: KeluaranAsisten | KeluaranRekomendasi;
  status: StatusHasilAi;
  catatan: string | null;
  created_at: string;
  verified_at: string | null;
  verified_by: Orang | null;
  user: Orang | null;
  merchant: { id: number; business_name: string } | null;
};

/** Jawaban POST /merchant/assistant: jawaban + poin + asumsi (keluaran AI tervalidasi). */
export type JawabanAsisten = { answer: string; points: string[]; assumption: string | null; result_id: number | null };
