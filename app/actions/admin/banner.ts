"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { validateBanner, type BannerInput } from "@/lib/banner";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Banner } from "@/types/banner";

// Banner & gambar platform: hanya super & ops (support hanya melihat). Backend tetap penjaga utamanya.
const ALASAN = "Tulis alasan penolakan (3–300 karakter).";
const idOk = (id: unknown) => Number.isInteger(id) && (id as number) > 0;

export async function buatBannerAdmin(_id: number | null, input: BannerInput): Promise<ActionResult<Banner>> {
  await requireAdmin("super", "ops");
  const masalah = validateBanner(input);
  if (Object.keys(masalah).length) return fieldErrorResult(masalah, "Periksa kembali isian banner.");
  const body = JSON.stringify({ ...input, title: input.title.trim() });
  return toResult(await adminFetch<Banner>("/banners", { method: "POST", body }));
}

type Tinjau = { status?: "disetujui" | "ditolak" | "nonaktif"; catatan?: string; sort_order?: number };

export async function tinjauBannerAdmin(id: number, t: Tinjau): Promise<ActionResult<Banner>> {
  await requireAdmin("super", "ops");
  if (!idOk(id)) return errorResult("VALIDATION_ERROR", "Banner tidak valid.");
  const catatan = t.catatan?.trim();
  if (t.status === "ditolak" && (!catatan || catatan.length < 3 || catatan.length > 300))
    return fieldErrorResult({ catatan: ALASAN }, "Periksa kembali alasan.");
  const body = JSON.stringify({ ...t, ...(catatan ? { catatan } : {}) });
  return toResult(await adminFetch<Banner>(`/banners/${id}`, { method: "PATCH", body }));
}

/** URL unggah bertanda tangan untuk gambar banner / pop-up platform (POST /admin/uploads). */
export async function mintaUnggahAdmin(berkas: {
  purpose: string;
  content_type: string;
  size: number;
}): Promise<ActionResult<{ upload_url: string; public_url: string; expires_at: string }>> {
  await requireAdmin("super", "ops");
  return toResult(
    await adminFetch<{ upload_url: string; public_url: string; expires_at: string }>("/uploads", {
      method: "POST",
      body: JSON.stringify(berkas),
    }),
  );
}
