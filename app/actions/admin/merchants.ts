"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { MerchantAction } from "@/types/admin";
import type { ActionResult } from "@/types/api";

const ACTIONS_NEEDING_REASON: MerchantAction[] = ["request-fix", "suspend"];
const ALL_ACTIONS: MerchantAction[] = [...ACTIONS_NEEDING_REASON, "verify", "reactivate", "close-today"];

// A-05 — transisi status penjual (K1). Alasan 1–500 karakter wajib untuk minta perbaikan & tangguhkan.
export async function applyMerchantAction(
  id: number,
  action: MerchantAction,
  rawReason?: string,
): Promise<ActionResult<null>> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0 || !ALL_ACTIONS.includes(action))
    return errorResult("VALIDATION_ERROR", "Data penjual tidak valid.");
  let body: string | undefined;
  if (ACTIONS_NEEDING_REASON.includes(action)) {
    const reason = typeof rawReason === "string" ? rawReason.trim() : "";
    if (reason.length < 1 || reason.length > 500)
      return fieldErrorResult({ reason: "Alasan wajib diisi, maksimal 500 karakter." }, "Periksa kembali alasan.");
    body = JSON.stringify({ reason });
  }
  const response = await adminFetch<null>(`/merchants/${id}/${action}`, { method: "POST", body });
  return response.ok ? { data: null } : toResult(response);
}
