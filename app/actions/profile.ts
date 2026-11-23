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
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Pengaturan belum tersimpan. Coba lagi.");

  // Form toko mengirim semua isian; templat WA mengirim wa_template saja.
  const isFullForm = typeof input === "object" && input !== null && !("wa_template" in input);
  const errors = validateProfile(input, isFullForm);
  if (Object.keys(errors).length > 0) {
    return fieldErrorResult(errors, "Periksa kembali isian pengaturan.");
  }

  return toResult(
    await merchantFetch<MerchantProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(parseProfile(input, isFullForm)),
    }),
  );
}
