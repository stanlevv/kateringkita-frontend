"use server";

// Server action kelola akun admin (khusus admin super): buat admin, ubah tingkat, aktif/nonaktif, dan reset kata sandi.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur: halaman/form -> server action (file ini) -> services/api.ts -> backend.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import type { AdminLevel } from "@/lib/admin-level";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { AdminWithPassword, AdminAccount } from "@/types/admin";
import type { ActionResult } from "@/types/api";

const ADMIN_LEVELS: AdminLevel[] = ["super", "ops", "support"];
// id dipakai untuk menyusun path API, jadi hanya bilangan bulat positif yang diterima.
const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const invalidDataError = () => errorResult("VALIDATION_ERROR", "Data tidak valid.");

/**
 * Membuat akun admin baru (POST /admin/admins). Hanya admin super.
 * Kata sandi sementara hanya ada di jawaban ini: tampilkan sekali ke admin super, lalu jangan disimpan.
 * @param input nama lengkap (`full_name`, 1–150 karakter), nomor HP (`phone`, 08… 10–13 digit), dan tingkat (`admin_level`)
 * @returns `{ data }` berisi akun baru beserta kata sandi sementara; `{ error }` bila isian salah (pesan per field) atau backend menolak
 */
export async function createAdmin(input: {
  full_name: string;
  phone: string;
  admin_level: AdminLevel;
}): Promise<ActionResult<AdminWithPassword>> {
  // 1. Hanya admin super; rapikan isian.
  await requireAdmin("super");
  const fullName = String(input?.full_name ?? "").trim();
  const phone = String(input?.phone ?? "").trim();
  // 2. Kumpulkan pesan galat per field.
  const errors: Record<string, string> = {};
  if (fullName.length < 1 || fullName.length > 150) errors.full_name = "Nama 1–150 karakter.";
  if (!/^08\d{8,11}$/.test(phone)) errors.phone = "Nomor HP harus diawali 08 dan 10–13 digit.";
  if (!ADMIN_LEVELS.includes(input?.admin_level)) errors.admin_level = "Pilih tingkat admin.";
  if (Object.keys(errors).length) return fieldErrorResult(errors, "Periksa kembali isian.");
  // 3. Kirim ke backend.
  return toResult(
    await adminFetch<AdminWithPassword>("/admins", {
      method: "POST",
      body: JSON.stringify({ full_name: fullName, phone, admin_level: input.admin_level }),
    }),
  );
}

/**
 * Mengubah tingkat admin (PATCH /admin/admins/:id/level). Hanya admin super.
 * @param id id akun admin
 * @param level "super" | "ops" | "support"
 * @returns `{ data }` berisi akun terbaru; `{ error }` bila id atau tingkat tidak valid, atau backend menolak
 */
export async function updateAdminLevel(id: number, level: AdminLevel): Promise<ActionResult<AdminAccount>> {
  await requireAdmin("super");
  if (!isValidId(id) || !ADMIN_LEVELS.includes(level)) return invalidDataError();
  return toResult(
    await adminFetch<AdminAccount>(`/admins/${id}/level`, {
      method: "PATCH",
      body: JSON.stringify({ admin_level: level }),
    }),
  );
}

/**
 * Mengaktifkan atau menonaktifkan akun admin (POST /admin/admins/:id/activate atau /deactivate). Hanya admin super.
 * @param id id akun admin
 * @param active true = aktifkan
 * @returns `{ data }` berisi akun terbaru; `{ error }` bila argumen tidak valid atau backend menolak
 */
export async function setAdminActive(id: number, active: boolean): Promise<ActionResult<AdminAccount>> {
  await requireAdmin("super");
  if (!isValidId(id) || typeof active !== "boolean") return invalidDataError();
  return toResult(
    await adminFetch<AdminAccount>(`/admins/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" }),
  );
}

/**
 * Membuat kata sandi sementara baru untuk admin lain (POST /admin/admins/:id/reset-password). Hanya admin super.
 * @param id id akun admin
 * @returns `{ data }` berisi akun beserta kata sandi sementara (tampilkan sekali); `{ error }` bila id tidak valid atau backend menolak
 */
export async function resetAdminPassword(id: number): Promise<ActionResult<AdminWithPassword>> {
  await requireAdmin("super");
  if (!isValidId(id)) return invalidDataError();
  return toResult(await adminFetch<AdminWithPassword>(`/admins/${id}/reset-password`, { method: "POST" }));
}
