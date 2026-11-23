"use server";

import { galat, galatField } from "@/lib/action-result";
import { adminFetch, hasil } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { ActionResult } from "@/types/api";

// Rubrik AI: verifikasi manual hasil AI. Hanya super & ops (support hanya melihat); backend tetap penjaga utamanya.
const ALASAN = "Tulis alasan penolakan (3–300 karakter).";

export async function verifikasiHasilAi(
  id: number,
  status: "disetujui" | "ditolak",
  catatan?: string,
): Promise<ActionResult<null>> {
  await requireAdmin("super", "ops");
  if (!Number.isInteger(id) || id < 1) return galat("VALIDATION_ERROR", "Hasil AI tidak valid.");
  if (status !== "disetujui" && status !== "ditolak") return galat("VALIDATION_ERROR", "Pilih setujui atau tolak.");
  const isi = typeof catatan === "string" ? catatan.trim() : "";
  if (status === "ditolak" && (isi.length < 3 || isi.length > 300))
    return galatField({ catatan: ALASAN }, "Periksa kembali catatan.");
  if (isi.length > 300) return galatField({ catatan: "Catatan maksimal 300 karakter." }, "Periksa kembali catatan.");
  const res = await adminFetch<null>(`/hasil-ai/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...(isi ? { catatan: isi } : {}) }),
  });
  return res.ok ? { data: null } : hasil(res);
}
