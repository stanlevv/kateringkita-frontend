"use server";

// Server action akun: ganti kata sandi untuk semua peran (penjual di Pengaturan, admin di Akun saya atau saat wajib ganti
// sandi sementara), serta ubah data akun dan verifikasi/ganti email dengan kode OTP untuk penjual di Pengaturan.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { accountSchema, changePasswordSchema, emailChangeSchema, otpCodeSchema, validateFields } from "@/lib/schemas";
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

/** Data akun yang dikembalikan backend (bentuk sama dengan `GET /me`). */
type AccountData = { user: Record<string, unknown>; merchant: Record<string, unknown> | null };

/**
 * Mengirim permintaan ke rute akun backend dengan token sesi. Tanpa sesi: dialihkan ke /login.
 * @param path   rute backend, misalnya `/me` atau `/me/email/otp`
 * @param method metode HTTP
 * @param body   isi permintaan yang sudah divalidasi
 * @returns `{ data }` bila berhasil, `{ error }` (dengan pesan per field bila ada) bila backend menolak
 */
async function sendAccountRequest<T>(path: string, method: "PATCH" | "POST", body: object): Promise<ActionResult<T>> {
  if (!(await getSession())) redirect("/login?alasan=sesi-habis");
  const response = await apiFetch<T>(path, { method, token: await getSessionToken(), body: JSON.stringify(body) });
  if (response.ok) return { data: response.data as T };
  return { error: response.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." } };
}

/**
 * Mengubah nama pemilik dan nomor WA login lewat PATCH /me. Backend mewajibkan kata sandi saat ini bila nomor berubah.
 * Email tidak diubah di sini, melainkan lewat {@link sendEmailCode} dan {@link verifyEmailCode}.
 * @param input nama, nomor WA, dan kata sandi saat ini (boleh kosong bila nomor tidak berubah)
 * @returns `{ data: { user, merchant } }` bila berhasil; `{ error }` bila isian tidak valid, sandi salah, atau nomor
 *   sudah dipakai akun lain
 */
export async function updateAccount(input: {
  full_name: string;
  phone: string;
  current_password: string;
}): Promise<ActionResult<AccountData>> {
  // 1. Cek isian dengan aturan yang sama seperti form.
  const errors = validateFields(accountSchema, input);
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali data akun.");
  // 2. Kirim hanya field yang dikenal; kata sandi hanya bila diisi.
  return sendAccountRequest<AccountData>("/me", "PATCH", {
    full_name: input.full_name.trim(),
    phone: input.phone,
    ...(input.current_password && { current_password: input.current_password }),
  });
}

/**
 * Meminta kode OTP lewat POST /me/email/otp. Tanpa `email`: kode dikirim ke email akun (verifikasi). Dengan `email`:
 * kode dikirim ke email baru (ganti email), dan kata sandi saat ini wajib.
 * @param input kosong untuk verifikasi email akun, atau `{ email, current_password }` untuk ganti email
 * @returns `{ data: { email } }` (alamat yang dikirimi kode); `{ error }` bila isian tidak valid atau backend menolak
 */
export async function sendEmailCode(
  input: { email: string; current_password: string } | null,
): Promise<ActionResult<{ email: string }>> {
  if (input === null) return sendAccountRequest("/me/email/otp", "POST", {});
  const errors = validateFields(emailChangeSchema, input);
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali email baru.");
  return sendAccountRequest("/me/email/otp", "POST", {
    email: input.email.trim().toLowerCase(),
    current_password: input.current_password,
  });
}

/**
 * Memeriksa kode OTP lewat POST /me/email/verify. Bila benar, email akun terverifikasi (dan diganti bila kodenya
 * dikirim ke email baru).
 * @param code kode 6 angka dari email
 * @returns `{ data: { user, merchant } }` bila benar; `{ error }` (field `code`) bila salah atau kedaluwarsa
 */
export async function verifyEmailCode(code: string): Promise<ActionResult<AccountData>> {
  const trimmedCode = code.trim();
  if (!otpCodeSchema.safeParse(trimmedCode).success) {
    return fieldErrorResult({ code: "Kode berisi 6 angka." }, "Periksa kode.");
  }
  return sendAccountRequest<AccountData>("/me/email/verify", "POST", { code: trimmedCode });
}
