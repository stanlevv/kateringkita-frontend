"use server";

// Server action ganti kata sandi untuk semua peran (penjual di Pengaturan, admin di Akun saya atau saat wajib ganti sandi sementara).
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { validateFields, changePasswordSchema } from "@/lib/schemas";
import { apiFetch } from "@/services/api";
import { getSession, getSessionToken } from "@/services/auth.service";
import { redirect } from "next/navigation";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";

/**
 * Mengganti kata sandi akun yang sedang login lewat PUT /me/password (backend menjawab 204 tanpa isi).
 * Backend mencabut sesi di perangkat lain; sesi di browser ini tetap berlaku.
 * `redirect()` menghentikan fungsi dan mengarahkan browser ke halaman lain; dipakai bila sesi sudah habis.
 * Skenario pratinjau (/pratinjau, hanya mode pengembangan) bisa memaksa gagal atau "sandi lama salah" tanpa memanggil backend.
 * @param input kata sandi lama (`current_password`) dan kata sandi baru (`new_password`)
 * @returns `{ data: { ok: true } }` bila berhasil; `{ error }` bila isian tidak lolos validasi (pesan per field),
 *   sandi lama salah, atau backend menolak. Tanpa sesi: dialihkan ke /login.
 */
export async function changePassword(input: {
  current_password: string;
  new_password: string;
}): Promise<ActionResult<{ ok: true }>> {
  // 1. Wajib login; skenario pratinjau "gagal-aksi" langsung gagal.
  if (!(await getSession())) redirect("/login?alasan=sesi-habis");
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Kata sandi belum diganti. Coba lagi.");

  // 2. Cek isian dengan aturan yang sama seperti form; skenario "konflik" meniru sandi lama salah.
  const errors = validateFields(changePasswordSchema, input);
  if (Object.keys(errors).length > 0) {
    return fieldErrorResult(errors, "Periksa kembali isian kata sandi.");
  }
  if (scenario === "konflik") {
    return fieldErrorResult({ current_password: "Kata sandi lama salah." }, "Kata sandi lama salah.");
  }
  // 3. Kirim ke backend dengan token sesi; hanya dua field ini yang dikirim.
  const response = await apiFetch("/me/password", {
    method: "PUT",
    token: await getSessionToken(),
    body: JSON.stringify({ current_password: input.current_password, new_password: input.new_password }),
  });
  if (response.ok) return { data: { ok: true } };
  return { error: response.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." } };
}
