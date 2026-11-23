"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

export type AnnouncementAudience = "all" | "customer" | "merchant";
const AUDIENCES: AnnouncementAudience[] = ["all", "customer", "merchant"];

// Broadcast pengumuman → notifikasi tab Info di aplikasi. Batas sama dengan backend (judul 120, isi 255).
export async function sendAnnouncement(input: {
  audience: AnnouncementAudience;
  title: string;
  body: string;
}): Promise<ActionResult<{ sent: number }>> {
  await requireAdmin();
  if (!AUDIENCES.includes(input?.audience)) return errorResult("VALIDATION_ERROR", "Pilih penerima pengumuman.");
  const title = String(input.title ?? "").trim();
  const body = String(input.body ?? "").trim();
  const errors: Record<string, string> = {};
  if (title.length < 1 || title.length > 120) errors.title = "Judul 1–120 karakter.";
  if (body.length < 1 || body.length > 255) errors.body = "Isi 1–255 karakter.";
  if (Object.keys(errors).length) return fieldErrorResult(errors, "Periksa kembali pengumuman.");
  return toResult(
    await adminFetch<{ sent: number }>("/broadcasts", {
      method: "POST",
      body: JSON.stringify({ audience: input.audience, title, body }),
    }),
  );
}
