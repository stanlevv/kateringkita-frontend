"use server";

import { galat, galatField } from "@/lib/action-result";
import { cekField, changePasswordSchema } from "@/lib/schemas";
import { apiFetch } from "@/services/api";
import { getSession, getSessionToken } from "@/services/authService";
import { redirect } from "next/navigation";
import { getSkenario } from "@/lib/skenario";
import type { ActionResult } from "@/types/api";

// F02: PUT /me/password (204); backend mencabut sesi lain, sesi ini tetap
// Semua role (penjual di Pengaturan, admin di Akun saya / ganti sandi sementara)
export async function changePassword(input: { current_password: string; new_password: string }): Promise<ActionResult<{ ok: true }>> {
  if (!(await getSession())) redirect("/login?alasan=sesi-habis");
  const s = await getSkenario();
  if (s === "gagal-aksi") return galat("INTERNAL_ERROR", "Kata sandi belum diganti. Coba lagi.");

  const masalah = cekField(changePasswordSchema, input);
  if (Object.keys(masalah).length > 0) {
    return galatField(masalah, "Periksa kembali isian kata sandi.");
  }
  if (s === "konflik") {
    return galatField({ current_password: "Kata sandi lama salah." }, "Kata sandi lama salah.");
  }
  const res = await apiFetch("/me/password", {
    method: "PUT",
    token: await getSessionToken(),
    body: JSON.stringify({ current_password: input.current_password, new_password: input.new_password }),
  });
  if (res.ok) return { data: { ok: true } };
  return { error: res.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." } };
}
