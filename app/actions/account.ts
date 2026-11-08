"use server";

import { galat, galatField } from "@/lib/action-result";
import { cekField, changePasswordSchema } from "@/lib/schemas";
import { requireMerchant } from "@/services/authService";
import { getSkenario } from "@/lib/skenario";
import type { ActionResult } from "@/types/api";

// shortcut: PUT /me/password di F02; tidak disimpan (D2)
export async function changePassword(input: { current_password: string; new_password: string }): Promise<ActionResult<{ ok: true }>> {
  await requireMerchant();
  const s = await getSkenario();
  if (s === "gagal-aksi") return galat("INTERNAL_ERROR", "Kata sandi belum diganti. Coba lagi.");

  const masalah = cekField(changePasswordSchema, input);
  if (Object.keys(masalah).length > 0) {
    return galatField(masalah, "Periksa kembali isian kata sandi.");
  }
  if (s === "konflik") {
    return galatField({ current_password: "Kata sandi lama salah." }, "Kata sandi lama salah.");
  }
  return { data: { ok: true } };
}
