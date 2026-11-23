"use server";

// Server action verifikasi manual hasil AI (jawaban asisten dan rekomendasi) oleh admin: setujui atau tolak dengan catatan.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur: halaman/form -> server action (file ini) -> services/api.ts -> backend. Hanya admin super dan ops; support hanya melihat.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

const REJECTION_REASON_MESSAGE = "Tulis alasan penolakan (3–300 karakter).";

/**
 * Menyimpan hasil verifikasi satu hasil AI (PATCH /admin/hasil-ai/:id).
 * @param id id hasil AI (bilangan bulat positif)
 * @param status "disetujui" atau "ditolak"
 * @param note catatan; wajib 3–300 karakter bila ditolak, opsional (maksimal 300) bila disetujui. Dikirim sebagai field `catatan`.
 * @returns `{ data: null }` bila tersimpan; `{ error }` bila id/status tidak valid, catatan tidak sesuai aturan, atau backend menolak
 */
export async function verifyAiResult(
  id: number,
  status: "disetujui" | "ditolak",
  note?: string,
): Promise<ActionResult<null>> {
  // 1. Hanya super dan ops; id dan status harus valid.
  await requireAdmin("super", "ops");
  if (!Number.isInteger(id) || id < 1) return errorResult("VALIDATION_ERROR", "Hasil AI tidak valid.");
  if (status !== "disetujui" && status !== "ditolak")
    return errorResult("VALIDATION_ERROR", "Pilih setujui atau tolak.");
  // 2. Cek panjang catatan setelah dirapikan.
  const trimmedNote = typeof note === "string" ? note.trim() : "";
  if (status === "ditolak" && (trimmedNote.length < 3 || trimmedNote.length > 300))
    return fieldErrorResult({ catatan: REJECTION_REASON_MESSAGE }, "Periksa kembali catatan.");
  if (trimmedNote.length > 300)
    return fieldErrorResult({ catatan: "Catatan maksimal 300 karakter." }, "Periksa kembali catatan.");
  // 3. Kirim ke backend; catatan kosong tidak ikut dikirim.
  const response = await adminFetch<null>(`/hasil-ai/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...(trimmedNote ? { catatan: trimmedNote } : {}) }),
  });
  return response.ok ? { data: null } : toResult(response);
}
