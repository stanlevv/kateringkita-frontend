"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { toResult, merchantFetch } from "@/services/api";
import { parseProfile, validateProfile } from "@/lib/schemas";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";
import type { MerchantProfile } from "@/types/profile";

export async function saveProfile(input: unknown): Promise<ActionResult<MerchantProfile>> {
  await requireMerchant();
  const s = await getScenario();
  if (s === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Pengaturan belum tersimpan. Coba lagi.");

  // Form toko mengirim semua isian; templat WA mengirim wa_template saja.
  const penuh = typeof input === "object" && input !== null && !("wa_template" in input);
  const masalah = validateProfile(input, penuh);
  if (Object.keys(masalah).length > 0) {
    return fieldErrorResult(masalah, "Periksa kembali isian pengaturan.");
  }

  return toResult(
    await merchantFetch<MerchantProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(parseProfile(input, penuh)),
    }),
  );
}
