"use server";

import { galat, galatField } from "@/lib/action-result";
import { hasil, merchantFetch } from "@/services/api";
import { bersihkanProfil, cekProfil } from "@/lib/schemas";
import { requireMerchant } from "@/services/authService";
import { getSkenario } from "@/lib/skenario";
import type { ActionResult } from "@/types/api";
import type { MerchantProfile } from "@/types/profile";

export async function saveProfile(input: unknown): Promise<ActionResult<MerchantProfile>> {
  await requireMerchant();
  const s = await getSkenario();
  if (s === "gagal-aksi") return galat("INTERNAL_ERROR", "Pengaturan belum tersimpan. Coba lagi.");

  // Form toko mengirim semua isian; templat WA mengirim wa_template saja.
  const penuh = typeof input === "object" && input !== null && !("wa_template" in input);
  const masalah = cekProfil(input, penuh);
  if (Object.keys(masalah).length > 0) {
    return galatField(masalah, "Periksa kembali isian pengaturan.");
  }

  return hasil(await merchantFetch<MerchantProfile>("/profile", { method: "PATCH", body: JSON.stringify(bersihkanProfil(input, penuh)) }));
}
