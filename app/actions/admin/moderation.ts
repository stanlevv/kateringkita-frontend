"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ModerationAction, ModerationMenu, ModerationReview } from "@/types/admin";
import type { ActionResult } from "@/types/api";

const TARGET_BY_ACTION: Record<ModerationAction, "reviews" | "menus"> = {
  hide: "reviews",
  unhide: "reviews",
  takedown: "menus",
  restore: "menus",
};
const ACTIONS_NEEDING_REASON: ModerationAction[] = ["hide", "takedown"];

// F19 — sembunyikan/tampilkan ulasan, turunkan/pulihkan menu. Alasan 1–500 karakter wajib untuk hide & takedown.
export async function moderate(
  id: number,
  action: ModerationAction,
  rawReason?: string,
): Promise<ActionResult<ModerationReview | ModerationMenu>> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0 || !Object.hasOwn(TARGET_BY_ACTION, action))
    return errorResult("VALIDATION_ERROR", "Data moderasi tidak valid.");
  let body: string | undefined;
  if (ACTIONS_NEEDING_REASON.includes(action)) {
    const reason = typeof rawReason === "string" ? rawReason.trim() : "";
    if (reason.length < 1 || reason.length > 500)
      return fieldErrorResult({ reason: "Alasan wajib diisi, maksimal 500 karakter." }, "Periksa kembali alasan.");
    body = JSON.stringify({ reason });
  }
  return toResult(
    await adminFetch<ModerationReview | ModerationMenu>(`/${TARGET_BY_ACTION[action]}/${id}/${action}`, {
      method: "POST",
      body,
    }),
  );
}

// Hapus satu foto menu (utama atau tambahan) tanpa menurunkan menunya; alasan wajib seperti takedown
export async function deleteMenuPhoto(
  id: number,
  url: string,
  rawReason: string,
): Promise<ActionResult<ModerationMenu>> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0 || typeof url !== "string" || !url || url.length > 500)
    return errorResult("VALIDATION_ERROR", "Data moderasi tidak valid.");
  const reason = typeof rawReason === "string" ? rawReason.trim() : "";
  if (reason.length < 1 || reason.length > 500)
    return fieldErrorResult({ reason: "Alasan wajib diisi, maksimal 500 karakter." }, "Periksa kembali alasan.");
  return toResult(
    await adminFetch<ModerationMenu>(`/menus/${id}/photos/remove`, {
      method: "POST",
      body: JSON.stringify({ url, reason }),
    }),
  );
}
