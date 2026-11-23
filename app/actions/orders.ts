"use server";

import { errorResult } from "@/lib/action-result";
import { toResult, merchantFetch } from "@/services/api";
import { actionTexts, type OrderAction } from "@/lib/order-status";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";
import type { MerchantOrder } from "@/types/order";

// M-04, M-08: status selalu diputuskan backend (D15); klien hanya mengirim aksi.
export async function orderAction(
  code: string,
  aksi: OrderAction,
  reason?: string,
): Promise<ActionResult<MerchantOrder>> {
  await requireMerchant();
  if (typeof code !== "string" || !Object.hasOwn(actionTexts, aksi))
    return errorResult("VALIDATION_ERROR", "Data pesanan tidak valid.");
  const s = await getScenario();
  if (s === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Gagal memproses pesanan. Coba lagi.");
  if (s === "status-berubah") return errorResult("CONFLICT", "Pesanan sudah berubah status.");
  if (s === "stok-bentrok" && aksi === "confirm")
    return errorResult("OUT_OF_STOCK", "Stok tidak cukup untuk pesanan ini.");
  const alasan = typeof reason === "string" ? reason.trim() : "";
  if (aksi === "reject" && !alasan) return errorResult("VALIDATION_ERROR", "Pilih alasan penolakan.");
  return toResult(
    await merchantFetch<MerchantOrder>(`/orders/${encodeURIComponent(code)}/${aksi}`, {
      method: "POST",
      body: JSON.stringify(aksi === "reject" ? { reason: alasan } : {}),
    }),
  );
}
