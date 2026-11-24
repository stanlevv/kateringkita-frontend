"use server";

// Server action admin untuk penyedia AI (gerbang AI: daftar kunci API Gemini dan sejenisnya): tambah, ubah, hapus, dan uji.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.
// Validasi isi ada di backend; file ini hanya meneruskan.

import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { AiTestResult, AiProviderInput, AiProvider } from "@/types/ai";

/**
 * Menambah penyedia AI (POST /admin/ai-providers).
 * @param input isian penyedia: jenis (`provider`), `label`, `model`, `api_key`, `priority`, `is_active`
 * @returns `{ data }` berisi penyedia baru, atau `{ error }` dari backend (mis. isian tidak valid)
 */
export async function createAiProvider(input: AiProviderInput): Promise<ActionResult<AiProvider>> {
  await requireAdmin();
  return toResult(await adminFetch<AiProvider>("/ai-providers", { method: "POST", body: JSON.stringify(input) }));
}

/**
 * Mengubah penyedia AI (PATCH /admin/ai-providers/:id). Jenis penyedia (`provider`) tidak bisa diganti.
 * @param id id penyedia
 * @param input field yang diubah saja
 * @returns `{ data }` berisi penyedia terbaru, atau `{ error }` dari backend
 */
export async function updateAiProvider(
  id: number,
  input: Partial<Omit<AiProviderInput, "provider">>,
): Promise<ActionResult<AiProvider>> {
  await requireAdmin();
  return toResult(
    await adminFetch<AiProvider>(`/ai-providers/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  );
}

/**
 * Menghapus penyedia AI (DELETE /admin/ai-providers/:id; backend menjawab tanpa isi).
 * @param id id penyedia
 * @returns `{ data: true }` bila terhapus, atau `{ error }` dari backend (pesan umum bila backend tidak memberi galat)
 */
export async function deleteAiProvider(id: number): Promise<ActionResult<true>> {
  await requireAdmin();
  const response = await adminFetch<null>(`/ai-providers/${id}`, { method: "DELETE" });
  return response.ok
    ? { data: true }
    : { error: response.error ?? { code: "UNKNOWN", message: "Penyedia belum terhapus. Coba lagi." } };
}

/**
 * Menguji koneksi penyedia AI (POST /admin/ai-providers/:id/test).
 * @param id id penyedia
 * @returns `{ data }` berisi hasil uji (`ok`, waktu respons dan contoh jawaban, atau pesan gagal), atau `{ error }` dari backend
 */
export async function testAiProvider(id: number): Promise<ActionResult<AiTestResult>> {
  await requireAdmin();
  return toResult(await adminFetch<AiTestResult>(`/ai-providers/${id}/test`, { method: "POST" }));
}
