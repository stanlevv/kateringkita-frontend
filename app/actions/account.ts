"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { validateFields, changePasswordSchema } from "@/lib/schemas";
import { apiFetch } from "@/services/api";
import { getSession, getSessionToken } from "@/services/auth.service";
import { redirect } from "next/navigation";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";

// F02: PUT /me/password (204); backend mencabut sesi lain, sesi ini tetap
// Semua role (penjual di Pengaturan, admin di Akun saya / ganti sandi sementara)
export async function changePassword(input: {
  current_password: string;
  new_password: string;
}): Promise<ActionResult<{ ok: true }>> {
  if (!(await getSession())) redirect("/login?alasan=sesi-habis");
  const s = await getScenario();
  if (s === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Kata sandi belum diganti. Coba lagi.");

  const masalah = validateFields(changePasswordSchema, input);
  if (Object.keys(masalah).length > 0) {
    return fieldErrorResult(masalah, "Periksa kembali isian kata sandi.");
  }
  if (s === "konflik") {
    return fieldErrorResult({ current_password: "Kata sandi lama salah." }, "Kata sandi lama salah.");
  }
  const res = await apiFetch("/me/password", {
    method: "PUT",
    token: await getSessionToken(),
    body: JSON.stringify({ current_password: input.current_password, new_password: input.new_password }),
  });
  if (res.ok) return { data: { ok: true } };
  return { error: res.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." } };
}
