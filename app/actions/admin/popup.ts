"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { PopupInput, Popup } from "@/types/popup";

// Pop-up promo mobile: hanya super & ops (support hanya melihat). Backend tetap penjaga utamanya.
const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;

function validatePopup(popup: Partial<PopupInput>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (popup.title !== undefined && (popup.title.trim().length < 3 || popup.title.trim().length > 80))
    errors.title = "Judul 3–80 karakter.";
  if (popup.image_url !== undefined && !popup.image_url) errors.image_url = "Unggah gambar pop-up.";
  if (
    popup.starts_at !== undefined &&
    popup.ends_at !== undefined &&
    !(Date.parse(popup.ends_at) > Date.parse(popup.starts_at))
  ) {
    errors.ends_at = "Waktu selesai harus setelah waktu mulai.";
  }
  return errors;
}

/** id null = buat (isian lengkap); id = ubah sebagian (mis. { is_active: false }). */
export async function savePopup(id: number | null, input: Partial<PopupInput>): Promise<ActionResult<Popup>> {
  await requireAdmin("super", "ops");
  if (id !== null && !isValidId(id)) return errorResult("VALIDATION_ERROR", "Pop-up tidak valid.");
  const errors = validatePopup(id === null ? { title: "", image_url: "", ...input } : input);
  if (Object.keys(errors).length) return fieldErrorResult(errors, "Periksa kembali isian pop-up.");
  const body = JSON.stringify(input.title === undefined ? input : { ...input, title: input.title.trim() });
  return toResult(
    await adminFetch<Popup>(id === null ? "/popups" : `/popups/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}
