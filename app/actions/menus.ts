"use server";

import { errorResult } from "@/lib/action-result";
import { toResult, merchantFetch } from "@/services/api";
import { menuFormSchema } from "@/lib/schemas";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";
import type { MerchantMenu } from "@/types/menu";

const isValidMenuId = (id: unknown) => typeof id === "number" && Number.isInteger(id) && id > 0;
const menuNotFound = () => errorResult("NOT_FOUND", "Menu tidak ditemukan.");

export async function adjustQuota(
  menuId: number,
  change: { delta: number } | { quota_today: number },
): Promise<ActionResult<MerchantMenu>> {
  await requireMerchant();
  const changeFields = (typeof change === "object" && change !== null ? change : {}) as Record<string, unknown>;
  if (
    !isValidMenuId(menuId) ||
    !(typeof changeFields.delta === "number" || typeof changeFields.quota_today === "number")
  ) {
    return errorResult("VALIDATION_ERROR", "Data kuota tidak valid.");
  }
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Kuota belum tersimpan. Coba lagi.");
  if (scenario === "konflik")
    return errorResult("CONFLICT", "Kuota sudah diubah di tempat lain. Muat ulang lalu coba lagi.");
  return toResult(
    await merchantFetch<MerchantMenu>(`/menus/${menuId}/quota`, { method: "PATCH", body: JSON.stringify(change) }),
  );
}

export async function setMenuActive(menuId: number, isActive: boolean): Promise<ActionResult<MerchantMenu>> {
  await requireMerchant();
  if (!isValidMenuId(menuId)) return menuNotFound();
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Menu belum diubah. Coba lagi.");
  return toResult(
    await merchantFetch<MerchantMenu>(`/menus/${menuId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    }),
  );
}

export async function saveMenu(id: number | null, input: unknown): Promise<ActionResult<MerchantMenu>> {
  await requireMerchant();
  if (id !== null && !isValidMenuId(id)) return menuNotFound();
  const scenario = await getScenario();
  if (scenario === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Menu belum tersimpan. Coba lagi.");

  const parsed = menuFormSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) (fields[issue.path.join(".")] ??= []).push(issue.message);
    return { error: { code: "VALIDATION_ERROR", message: "Periksa kembali isian menu.", fields } };
  }
  const path = id === null ? "/menus" : `/menus/${id}`;
  return toResult(
    await merchantFetch<MerchantMenu>(path, {
      method: id === null ? "POST" : "PATCH",
      body: JSON.stringify(parsed.data),
    }),
  );
}

export async function requestUpload(file: {
  purpose: "menu" | "logo" | "banner" | "cover";
  content_type: string;
  size: number;
}): Promise<ActionResult<{ upload_url: string; public_url: string; expires_at: string }>> {
  await requireMerchant();
  if ((await getScenario()) === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Foto gagal diunggah. Coba lagi");
  return toResult(
    await merchantFetch<{ upload_url: string; public_url: string; expires_at: string }>("/uploads", {
      method: "POST",
      body: JSON.stringify(file),
    }),
  );
}
