"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { MerchantAction } from "@/types/admin";
import type { ActionResult } from "@/types/api";

const DENGAN_ALASAN: MerchantAction[] = ["request-fix", "suspend"];
const SEMUA: MerchantAction[] = [...DENGAN_ALASAN, "verify", "reactivate", "close-today"];

// A-05 — transisi status penjual (K1). Alasan 1–500 karakter wajib untuk minta perbaikan & tangguhkan.
export async function aksiPenjual(id: number, aksi: MerchantAction, alasan?: string): Promise<ActionResult<null>> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0 || !SEMUA.includes(aksi))
    return errorResult("VALIDATION_ERROR", "Data penjual tidak valid.");
  let body: string | undefined;
  if (DENGAN_ALASAN.includes(aksi)) {
    const reason = typeof alasan === "string" ? alasan.trim() : "";
    if (reason.length < 1 || reason.length > 500)
      return fieldErrorResult({ reason: "Alasan wajib diisi, maksimal 500 karakter." }, "Periksa kembali alasan.");
    body = JSON.stringify({ reason });
  }
  const res = await adminFetch<null>(`/merchants/${id}/${aksi}`, { method: "POST", body });
  return res.ok ? { data: null } : toResult(res);
}
