"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { validateServiceFee } from "@/services/admin-master.service";
import { parsePromo, validatePromo } from "@/lib/schemas";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";
import type { Maintenance } from "@/types/meta";

const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const invalidPromoError = () => errorResult("VALIDATION_ERROR", "Data promo tidak valid.");

// A-02/A-03 — promo platform. Validasi sama dengan form penjual (cekPromo); backend tetap sumber kebenaran.
// Kode tidak bisa diubah; promo baru langsung aktif (bawaan backend), status diubah lewat setAktifPromoPlatform.
export async function savePlatformPromo(id: number | null, input: unknown): Promise<ActionResult<Promo>> {
  await requireAdmin();
  if (id !== null && !isValidId(id)) return invalidPromoError();
  const errors = validatePromo(input);
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali isian promo.");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- status hanya lewat Aktifkan/Nonaktifkan di daftar
  const { code, is_active, ...promoFields } = parsePromo(input);
  const body = JSON.stringify(id === null ? { code, ...promoFields } : promoFields);
  return toResult(
    await adminFetch<Promo>(id === null ? "/promos" : `/promos/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}

export async function setPlatformPromoActive(id: number, active: boolean): Promise<ActionResult<Promo>> {
  await requireAdmin();
  if (!isValidId(id) || typeof active !== "boolean") return invalidPromoError();
  return toResult(await adminFetch<Promo>(`/promos/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" }));
}

// A-04 — biaya layanan: bilangan bulat 0–100.000.
export async function saveServiceFee(value: number): Promise<ActionResult<{ service_fee: number }>> {
  await requireAdmin();
  const feeError = validateServiceFee(value);
  if (feeError) return fieldErrorResult({ value: feeError }, feeError);
  return toResult(
    await adminFetch<{ service_fee: number }>("/settings/service-fee", {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
  );
}

// Kontak CS untuk aplikasi pembeli: nomor WA 08… (10–13 digit) atau kosong.
export async function saveCustomerServiceContact(
  whatsappNumber: string,
): Promise<ActionResult<{ cs_whatsapp: string | null }>> {
  await requireAdmin();
  const trimmedNumber = typeof whatsappNumber === "string" ? whatsappNumber.trim() : "";
  if (trimmedNumber && !/^08\d{8,11}$/.test(trimmedNumber))
    return fieldErrorResult({ wa_number: "Nomor WA harus diawali 08 dan 10–13 digit." }, "Periksa nomor WA.");
  const response = await adminFetch<{ cs_whatsapp: string | null }>("/settings/cs-contact", {
    method: "PUT",
    body: JSON.stringify({ wa_number: trimmedNumber }),
  });
  return response.ok ? { data: response.data ?? { cs_whatsapp: null } } : toResult(response);
}

// F27 mode pemeliharaan: penjual & pembeli dapat 503 selama aktif; pesan kosong = pesan bawaan backend.
export async function saveMaintenance(
  active: boolean,
  message: string,
): Promise<ActionResult<{ maintenance: Maintenance }>> {
  await requireAdmin();
  const trimmedMessage = typeof message === "string" ? message.trim() : "";
  if (trimmedMessage.length > 200) return fieldErrorResult({ pesan: "Pesan maksimal 200 karakter." }, "Periksa pesan.");
  return toResult(
    await adminFetch<{ maintenance: Maintenance }>("/settings/maintenance", {
      method: "PUT",
      body: JSON.stringify({ aktif: active === true, pesan: trimmedMessage }),
    }),
  );
}
