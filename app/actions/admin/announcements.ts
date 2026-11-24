"use server";

// Server action pengumuman admin: menyiarkan pengumuman yang masuk sebagai notifikasi di tab Info aplikasi.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

/** Penerima pengumuman: semua pengguna, semua pembeli, atau semua penjual. */
export type AnnouncementAudience = "all" | "customer" | "merchant";
const AUDIENCES: AnnouncementAudience[] = ["all", "customer", "merchant"];

/**
 * Mengirim pengumuman (POST /admin/broadcasts). Batas panjang sama dengan backend: judul 1–120, isi 1–255 karakter.
 * @param input penerima (`audience`), judul (`title`), dan isi (`body`); teks dirapikan sebelum dicek
 * @returns `{ data: { sent } }` berisi jumlah penerima; `{ error }` bila penerima tidak dikenal,
 *   judul/isi tidak sesuai batas (pesan per field), atau backend menolak
 */
export async function sendAnnouncement(input: {
  audience: AnnouncementAudience;
  title: string;
  body: string;
}): Promise<ActionResult<{ sent: number }>> {
  // 1. Wajib admin; penerima harus dikenal.
  await requireAdmin();
  if (!AUDIENCES.includes(input?.audience)) return errorResult("VALIDATION_ERROR", "Pilih penerima pengumuman.");
  // 2. Rapikan teks lalu cek panjangnya; pesan galat dikumpulkan per field.
  const title = String(input.title ?? "").trim();
  const body = String(input.body ?? "").trim();
  const errors: Record<string, string> = {};
  if (title.length < 1 || title.length > 120) errors.title = "Judul 1–120 karakter.";
  if (body.length < 1 || body.length > 255) errors.body = "Isi 1–255 karakter.";
  if (Object.keys(errors).length) return fieldErrorResult(errors, "Periksa kembali pengumuman.");
  // 3. Kirim ke backend.
  return toResult(
    await adminFetch<{ sent: number }>("/broadcasts", {
      method: "POST",
      body: JSON.stringify({ audience: input.audience, title, body }),
    }),
  );
}
