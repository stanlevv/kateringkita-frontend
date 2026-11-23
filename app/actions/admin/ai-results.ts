"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

// Rubrik AI: verifikasi manual hasil AI. Hanya super & ops (support hanya melihat); backend tetap penjaga utamanya.
const REJECTION_REASON_MESSAGE = "Tulis alasan penolakan (3–300 karakter).";

export async function verifyAiResult(
  id: number,
  status: "disetujui" | "ditolak",
  note?: string,
): Promise<ActionResult<null>> {
  await requireAdmin("super", "ops");
  if (!Number.isInteger(id) || id < 1) return errorResult("VALIDATION_ERROR", "Hasil AI tidak valid.");
  if (status !== "disetujui" && status !== "ditolak")
    return errorResult("VALIDATION_ERROR", "Pilih setujui atau tolak.");
  const trimmedNote = typeof note === "string" ? note.trim() : "";
  if (status === "ditolak" && (trimmedNote.length < 3 || trimmedNote.length > 300))
    return fieldErrorResult({ catatan: REJECTION_REASON_MESSAGE }, "Periksa kembali catatan.");
  if (trimmedNote.length > 300)
    return fieldErrorResult({ catatan: "Catatan maksimal 300 karakter." }, "Periksa kembali catatan.");
  const response = await adminFetch<null>(`/hasil-ai/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...(trimmedNote ? { catatan: trimmedNote } : {}) }),
  });
  return response.ok ? { data: null } : toResult(response);
}
