"use server";

import { galat, galatField } from "@/lib/action-result";
import { adminFetch, hasil } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { ActionResult } from "@/types/api";
import type { IsianPopup, Popup } from "@/types/popup";

// Pop-up promo mobile: hanya super & ops (support hanya melihat). Backend tetap penjaga utamanya.
const idOk = (id: unknown) => Number.isInteger(id) && (id as number) > 0;

function cekPopup(v: Partial<IsianPopup>): Record<string, string> {
  const out: Record<string, string> = {};
  if (v.title !== undefined && (v.title.trim().length < 3 || v.title.trim().length > 80)) out.title = "Judul 3–80 karakter.";
  if (v.image_url !== undefined && !v.image_url) out.image_url = "Unggah gambar pop-up.";
  if (v.starts_at !== undefined && v.ends_at !== undefined && !(Date.parse(v.ends_at) > Date.parse(v.starts_at))) {
    out.ends_at = "Waktu selesai harus setelah waktu mulai.";
  }
  return out;
}

/** id null = buat (isian lengkap); id = ubah sebagian (mis. { is_active: false }). */
export async function simpanPopup(id: number | null, input: Partial<IsianPopup>): Promise<ActionResult<Popup>> {
  await requireAdmin("super", "ops");
  if (id !== null && !idOk(id)) return galat("VALIDATION_ERROR", "Pop-up tidak valid.");
  const masalah = cekPopup(id === null ? { title: "", image_url: "", ...input } : input);
  if (Object.keys(masalah).length) return galatField(masalah, "Periksa kembali isian pop-up.");
  const body = JSON.stringify(input.title === undefined ? input : { ...input, title: input.title.trim() });
  return hasil(await adminFetch<Popup>(id === null ? "/popups" : `/popups/${id}`, { method: id === null ? "POST" : "PATCH", body }));
}
