"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { validateBanner, type BannerInput } from "@/lib/banner";
import { toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Banner } from "@/types/banner";

// Banner beranda penjual: POST/PATCH/DELETE /merchant/banners. Aturan sama dengan backend (banner.dto); 1 banner aktif dicek backend.
const idOk = (id: unknown) => Number.isInteger(id) && (id as number) > 0;

export async function simpanBannerToko(id: number | null, input: BannerInput): Promise<ActionResult<Banner>> {
  await requireMerchant();
  if (id !== null && !idOk(id)) return errorResult("VALIDATION_ERROR", "Banner tidak valid.");
  const masalah = validateBanner(input);
  if (Object.keys(masalah).length) return fieldErrorResult(masalah, "Periksa kembali isian banner.");
  const body = JSON.stringify({
    title: input.title.trim(),
    image_url: input.image_url,
    target: input.target,
    promo_id: input.promo_id,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
  });
  return toResult(
    await merchantFetch<Banner>(id === null ? "/banners" : `/banners/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}

export async function hapusBannerToko(id: number): Promise<ActionResult<{ id: number }>> {
  await requireMerchant();
  if (!idOk(id)) return errorResult("VALIDATION_ERROR", "Banner tidak valid.");
  return toResult(await merchantFetch<{ id: number }>(`/banners/${id}`, { method: "DELETE" }));
}
