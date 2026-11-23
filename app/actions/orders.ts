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
  action: OrderAction,
  reason?: string,
): Promise<ActionResult<MerchantOrder>> {
  await requireMerchant();
  if (typeof code !== "string" || !Object.hasOwn(actionTexts, action))
    return errorResult("VALIDATION_ERROR", "Data pesanan tidak valid.");
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Gagal memproses pesanan. Coba lagi.");
  if (scenario === "status-berubah") return errorResult("CONFLICT", "Pesanan sudah berubah status.");
  if (scenario === "stok-bentrok" && action === "confirm")
    return errorResult("OUT_OF_STOCK", "Stok tidak cukup untuk pesanan ini.");
  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (action === "reject" && !trimmedReason) return errorResult("VALIDATION_ERROR", "Pilih alasan penolakan.");
  return toResult(
    await merchantFetch<MerchantOrder>(`/orders/${encodeURIComponent(code)}/${action}`, {
      method: "POST",
      body: JSON.stringify(action === "reject" ? { reason: trimmedReason } : {}),
    }),
  );
}
