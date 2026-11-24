"use server";

// Server action pengaturan toko: menyimpan profil toko lengkap (form Pengaturan) atau templat pesan WhatsApp saja.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { toResult, merchantFetch } from "@/services/api";
import { parseProfile, validateProfile } from "@/lib/schemas";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";
import type { MerchantProfile } from "@/types/profile";

/**
 * Menyimpan profil toko (PATCH /merchant/profile). Hanya field yang boleh diubah yang dikirim, teksnya dirapikan.
 * Skenario pratinjau (/pratinjau, hanya mode pengembangan) "gagal-aksi" memaksa gagal tanpa memanggil backend.
 * @param input isian form toko lengkap, atau `{ wa_template }` saja dari editor templat WA
 * @returns `{ data }` berisi profil terbaru; `{ error }` bila isian tidak lolos validasi (pesan per field) atau backend menolak
 */
export async function saveProfile(input: unknown): Promise<ActionResult<MerchantProfile>> {
  // 1. Wajib login penjual; skenario pratinjau bisa memaksa gagal.
  await requireMerchant();
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Pengaturan belum tersimpan. Coba lagi.");

  // 2. Form toko mengirim semua isian; editor templat WA mengirim wa_template saja. Validasi menyesuaikan.
  const isFullForm = typeof input === "object" && input !== null && !("wa_template" in input);
  const errors = validateProfile(input, isFullForm);
  if (Object.keys(errors).length > 0) {
    return fieldErrorResult(errors, "Periksa kembali isian pengaturan.");
  }

  // 3. Kirim hanya field yang dikenal (parseProfile membuang kunci lain).
  return toResult(
    await merchantFetch<MerchantProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(parseProfile(input, isFullForm)),
    }),
  );
}
