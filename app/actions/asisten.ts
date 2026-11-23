"use server";

import { galat, galatField } from "@/lib/action-result";
import { hasil, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/authService";
import type { ActionResult } from "@/types/api";
import type { JawabanAsisten } from "@/types/hasil-ai";

// F17: POST /merchant/assistant (Gemini di backend; konteks data toko sendiri)
export async function tanyaAsisten(question: string): Promise<ActionResult<JawabanAsisten>> {
  await requireMerchant();
  if (typeof question !== "string") return galat("VALIDATION_ERROR", "Pertanyaan tidak valid.");
  const q = question.trim();
  if (q.length < 1 || q.length > 500)
    return galatField({ question: "Pertanyaan 1–500 karakter." }, "Pertanyaan 1–500 karakter.");
  return hasil(
    await merchantFetch<JawabanAsisten>("/assistant", { method: "POST", body: JSON.stringify({ question: q }) }),
  );
}
