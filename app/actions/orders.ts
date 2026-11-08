"use server";

import { galat } from "@/lib/action-result";
import { hasil, merchantFetch } from "@/services/api";
import { teksAksi, type AksiPesanan } from "@/lib/order-status";
import { requireMerchant } from "@/services/authService";
import { getSkenario } from "@/lib/skenario";
import type { ActionResult } from "@/types/api";
import type { MerchantOrder } from "@/types/order";

// M-04, M-08: status selalu diputuskan backend (D15); klien hanya mengirim aksi.
export async function orderAction(code: string, aksi: AksiPesanan, reason?: string): Promise<ActionResult<MerchantOrder>> {
  await requireMerchant();
  if (typeof code !== "string" || !Object.hasOwn(teksAksi, aksi)) return galat("VALIDATION_ERROR", "Data pesanan tidak valid.");
  const s = await getSkenario();
  if (s === "gagal-aksi") return galat("INTERNAL_ERROR", "Gagal memproses pesanan. Coba lagi.");
  if (s === "status-berubah") return galat("CONFLICT", "Pesanan sudah berubah status.");
  if (s === "stok-bentrok" && aksi === "confirm") return galat("OUT_OF_STOCK", "Stok tidak cukup untuk pesanan ini.");
  const alasan = typeof reason === "string" ? reason.trim() : "";
  if (aksi === "reject" && !alasan) return galat("VALIDATION_ERROR", "Pilih alasan penolakan.");
  return hasil(await merchantFetch<MerchantOrder>(`/orders/${encodeURIComponent(code)}/${aksi}`, { method: "POST", body: JSON.stringify(aksi === "reject" ? { reason: alasan } : {}) }));
}
