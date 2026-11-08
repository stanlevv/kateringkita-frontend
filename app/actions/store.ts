"use server";

import { hasil, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/authService";
import { getSkenario } from "@/lib/skenario";
import type { ActionResult } from "@/types/api";

export async function setStoreOpen(isOpen: boolean): Promise<ActionResult<{ is_open: boolean }>> {
  await requireMerchant();
  if ((await getSkenario()) === "gagal-aksi") {
    return { error: { code: "INTERNAL_ERROR", message: "Status dapur belum berubah. Coba lagi." } };
  }
  return hasil(await merchantFetch<{ is_open: boolean }>("/status", { method: "PATCH", body: JSON.stringify({ is_open: isOpen }) }));
}
