"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { AssistantAnswer } from "@/types/ai-result";

// F17: POST /merchant/assistant (Gemini di backend; konteks data toko sendiri)
export async function askAssistant(question: string): Promise<ActionResult<AssistantAnswer>> {
  await requireMerchant();
  if (typeof question !== "string") return errorResult("VALIDATION_ERROR", "Pertanyaan tidak valid.");
  const trimmedQuestion = question.trim();
  if (trimmedQuestion.length < 1 || trimmedQuestion.length > 500)
    return fieldErrorResult({ question: "Pertanyaan 1–500 karakter." }, "Pertanyaan 1–500 karakter.");
  return toResult(
    await merchantFetch<AssistantAnswer>("/assistant", {
      method: "POST",
      body: JSON.stringify({ question: trimmedQuestion }),
    }),
  );
}
