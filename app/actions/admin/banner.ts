"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { validateBanner, type BannerInput } from "@/lib/banner";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Banner } from "@/types/banner";

// Banner & gambar platform: hanya super & ops (support hanya melihat). Backend tetap penjaga utamanya.
const REJECTION_REASON_MESSAGE = "Tulis alasan penolakan (3–300 karakter).";
const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;

export async function createAdminBanner(_id: number | null, input: BannerInput): Promise<ActionResult<Banner>> {
  await requireAdmin("super", "ops");
  const errors = validateBanner(input);
  if (Object.keys(errors).length) return fieldErrorResult(errors, "Periksa kembali isian banner.");
  const body = JSON.stringify({ ...input, title: input.title.trim() });
  return toResult(await adminFetch<Banner>("/banners", { method: "POST", body }));
}

type BannerReviewInput = { status?: "disetujui" | "ditolak" | "nonaktif"; catatan?: string; sort_order?: number };

export async function reviewAdminBanner(id: number, review: BannerReviewInput): Promise<ActionResult<Banner>> {
  await requireAdmin("super", "ops");
  if (!isValidId(id)) return errorResult("VALIDATION_ERROR", "Banner tidak valid.");
  const note = review.catatan?.trim();
  if (review.status === "ditolak" && (!note || note.length < 3 || note.length > 300))
    return fieldErrorResult({ catatan: REJECTION_REASON_MESSAGE }, "Periksa kembali alasan.");
  const body = JSON.stringify({ ...review, ...(note ? { catatan: note } : {}) });
  return toResult(await adminFetch<Banner>(`/banners/${id}`, { method: "PATCH", body }));
}

/** URL unggah bertanda tangan untuk gambar banner / pop-up platform (POST /admin/uploads). */
export async function requestAdminUpload(file: {
  purpose: string;
  content_type: string;
  size: number;
}): Promise<ActionResult<{ upload_url: string; public_url: string; expires_at: string }>> {
  await requireAdmin("super", "ops");
  return toResult(
    await adminFetch<{ upload_url: string; public_url: string; expires_at: string }>("/uploads", {
      method: "POST",
      body: JSON.stringify(file),
    }),
  );
}
