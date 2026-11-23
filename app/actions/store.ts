"use server";

import { toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";

export async function setStoreOpen(isOpen: boolean): Promise<ActionResult<{ is_open: boolean }>> {
  await requireMerchant();
  if ((await getScenario()) === "gagal-aksi") {
    return { error: { code: "INTERNAL_ERROR", message: "Status dapur belum berubah. Coba lagi." } };
  }
  return toResult(
    await merchantFetch<{ is_open: boolean }>("/status", {
      method: "PATCH",
      body: JSON.stringify({ is_open: isOpen }),
    }),
  );
}
