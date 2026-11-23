"use server";

import { errorResult } from "@/lib/action-result";
import { toResult, merchantFetch } from "@/services/api";
import { menuFormSchema } from "@/lib/schemas";
import { requireMerchant } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { ActionResult } from "@/types/api";
import type { MerchantMenu } from "@/types/menu";

const idMenu = (id: unknown) => typeof id === "number" && Number.isInteger(id) && id > 0;
const tidakAda = () => errorResult("NOT_FOUND", "Menu tidak ditemukan.");

export async function adjustQuota(
  menuId: number,
  ubah: { delta: number } | { quota_today: number },
): Promise<ActionResult<MerchantMenu>> {
  await requireMerchant();
  const o = (typeof ubah === "object" && ubah !== null ? ubah : {}) as Record<string, unknown>;
  if (!idMenu(menuId) || !(typeof o.delta === "number" || typeof o.quota_today === "number")) {
    return errorResult("VALIDATION_ERROR", "Data kuota tidak valid.");
  }
  const s = await getScenario();
  if (s === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Kuota belum tersimpan. Coba lagi.");
  if (s === "konflik") return errorResult("CONFLICT", "Kuota sudah diubah di tempat lain. Muat ulang lalu coba lagi.");
  return toResult(
    await merchantFetch<MerchantMenu>(`/menus/${menuId}/quota`, { method: "PATCH", body: JSON.stringify(ubah) }),
  );
}

export async function setMenuActive(menuId: number, isActive: boolean): Promise<ActionResult<MerchantMenu>> {
  await requireMerchant();
  if (!idMenu(menuId)) return tidakAda();
  const s = await getScenario();
  if (s === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Menu belum diubah. Coba lagi.");
  return toResult(
    await merchantFetch<MerchantMenu>(`/menus/${menuId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    }),
  );
}

export async function saveMenu(id: number | null, input: unknown): Promise<ActionResult<MerchantMenu>> {
  await requireMerchant();
  if (id !== null && !idMenu(id)) return tidakAda();
  const s = await getScenario();
  if (s === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Menu belum tersimpan. Coba lagi.");

  const r = menuFormSchema.safeParse(input);
  if (!r.success) {
    const fields: Record<string, string[]> = {};
    for (const i of r.error.issues) (fields[i.path.join(".")] ??= []).push(i.message);
    return { error: { code: "VALIDATION_ERROR", message: "Periksa kembali isian menu.", fields } };
  }
  const path = id === null ? "/menus" : `/menus/${id}`;
  return toResult(
    await merchantFetch<MerchantMenu>(path, { method: id === null ? "POST" : "PATCH", body: JSON.stringify(r.data) }),
  );
}

export async function requestUpload(berkas: {
  purpose: "menu" | "logo" | "banner" | "cover";
  content_type: string;
  size: number;
}): Promise<ActionResult<{ upload_url: string; public_url: string; expires_at: string }>> {
  await requireMerchant();
  if ((await getScenario()) === "gagal-aksi") return errorResult("INTERNAL_ERROR", "Foto gagal diunggah. Coba lagi");
  return toResult(
    await merchantFetch<{ upload_url: string; public_url: string; expires_at: string }>("/uploads", {
      method: "POST",
      body: JSON.stringify(berkas),
    }),
  );
}
