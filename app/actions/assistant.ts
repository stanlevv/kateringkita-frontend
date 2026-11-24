"use server";

// Server action Asisten AI penjual: meneruskan pertanyaan ke backend, yang menjawab dengan Gemini memakai data toko penjual itu sendiri.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { AssistantAnswer } from "@/types/ai-result";

/**
 * Mengirim pertanyaan penjual ke asisten AI (POST /merchant/assistant).
 * @param question pertanyaan; spasi di awal dan akhir dibuang, panjang 1–500 karakter
 * @returns `{ data }` berisi jawaban asisten; `{ error }` bila pertanyaan bukan teks, kosong, terlalu panjang,
 *   atau backend gagal (mis. asisten belum diaktifkan)
 */
export async function askAssistant(question: string): Promise<ActionResult<AssistantAnswer>> {
  // 1. Wajib login penjual; pertanyaan harus teks 1–500 karakter setelah dirapikan.
  await requireMerchant();
  if (typeof question !== "string") return errorResult("VALIDATION_ERROR", "Pertanyaan tidak valid.");
  const trimmedQuestion = question.trim();
  if (trimmedQuestion.length < 1 || trimmedQuestion.length > 500)
    return fieldErrorResult({ question: "Pertanyaan 1–500 karakter." }, "Pertanyaan 1–500 karakter.");
  // 2. Kirim pertanyaan yang sudah dirapikan ke backend.
  return toResult(
    await merchantFetch<AssistantAnswer>("/assistant", {
      method: "POST",
      body: JSON.stringify({ question: trimmedQuestion }),
    }),
  );
}
