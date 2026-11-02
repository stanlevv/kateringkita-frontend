"use server";

import { galat, galatField } from "@/lib/action-result";
import { adminFetch, hasil } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/session";
import type { AksiPenjual } from "@/lib/admin/types";
import type { ActionResult } from "@/lib/types";

const DENGAN_ALASAN: AksiPenjual[] = ["request-fix", "suspend"];
const SEMUA: AksiPenjual[] = [...DENGAN_ALASAN, "verify", "reactivate", "close-today"];

// A-05 — transisi status penjual (K1). Alasan 1–500 karakter wajib untuk minta perbaikan & tangguhkan.
export async function aksiPenjual(id: number, aksi: AksiPenjual, alasan?: string): Promise<ActionResult<null>> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0 || !SEMUA.includes(aksi)) return galat("VALIDATION_ERROR", "Data penjual tidak valid.");
  let body: string | undefined;
  if (DENGAN_ALASAN.includes(aksi)) {
    const reason = typeof alasan === "string" ? alasan.trim() : "";
    if (reason.length < 1 || reason.length > 500) return galatField({ reason: "Alasan wajib diisi, maksimal 500 karakter." }, "Periksa kembali alasan.");
    body = JSON.stringify({ reason });
  }
  const res = await adminFetch<null>(`/merchants/${id}/${aksi}`, { method: "POST", body });
  return res.ok ? { data: null } : hasil(res);
}
