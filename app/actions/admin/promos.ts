"use server";

// Server action pengaturan platform oleh admin: promo platform, biaya layanan, kontak CS (layanan pelanggan), dan mode pemeliharaan.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur: halaman/form -> server action (file ini) -> services/api.ts -> backend. Backend tetap sumber kebenaran aturan isian.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { validateServiceFee } from "@/services/admin-master.service";
import { parsePromo, validatePromo } from "@/lib/schemas";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";
import type { Maintenance } from "@/types/meta";

// id dipakai untuk menyusun path API, jadi hanya bilangan bulat positif yang diterima.
const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const invalidPromoError = () => errorResult("VALIDATION_ERROR", "Data promo tidak valid.");

/**
 * Membuat promo platform (id null, POST /admin/promos) atau mengubahnya (PATCH /admin/promos/:id).
 * Validasi sama dengan form promo penjual (validatePromo). Kode hanya dikirim saat membuat (tidak bisa diubah);
 * `is_active` tidak pernah dikirim: promo baru langsung aktif (bawaan backend), statusnya diubah lewat `setPlatformPromoActive`.
 * @param id id promo yang diubah, atau null untuk promo baru
 * @param input isian form promo
 * @returns `{ data }` berisi promo tersimpan; `{ error }` bila id tidak valid, isian salah (pesan per field),
 *   atau backend menolak (mis. 409 kode sudah dipakai)
 */
export async function savePlatformPromo(id: number | null, input: unknown): Promise<ActionResult<Promo>> {
  // 1. Wajib admin; id dan isian harus valid.
  await requireAdmin();
  if (id !== null && !isValidId(id)) return invalidPromoError();
  const errors = validatePromo(input);
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali isian promo.");
  // 2. Buang is_active; kode hanya ikut saat membuat promo baru.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- status hanya lewat Aktifkan/Nonaktifkan di daftar
  const { code, is_active, ...promoFields } = parsePromo(input);
  const body = JSON.stringify(id === null ? { code, ...promoFields } : promoFields);
  // 3. Baru -> POST, lama -> PATCH.
  return toResult(
    await adminFetch<Promo>(id === null ? "/promos" : `/promos/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}

/**
 * Mengaktifkan atau menonaktifkan promo platform (POST /admin/promos/:id/activate atau /deactivate).
 * @param id id promo
 * @param active true = aktifkan
 * @returns `{ data }` berisi promo terbaru; `{ error }` bila argumen tidak valid atau backend menolak
 */
export async function setPlatformPromoActive(id: number, active: boolean): Promise<ActionResult<Promo>> {
  await requireAdmin();
  if (!isValidId(id) || typeof active !== "boolean") return invalidPromoError();
  return toResult(await adminFetch<Promo>(`/promos/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" }));
}

/**
 * Menyimpan biaya layanan platform (PUT /admin/settings/service-fee): bilangan bulat rupiah 0–100.000.
 * @param value besar biaya layanan
 * @returns `{ data: { service_fee } }`; `{ error }` bila nilai tidak valid (pesan di field `value`) atau backend menolak
 */
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

/**
 * Menyimpan nomor WhatsApp CS yang tampil di aplikasi pembeli (PUT /admin/settings/cs-contact). Kosong = tanpa kontak CS.
 * @param whatsappNumber nomor 08… (10–13 digit) atau teks kosong; dikirim sebagai field `wa_number`
 * @returns `{ data: { cs_whatsapp } }` (null bila dikosongkan); `{ error }` bila format nomor salah atau backend menolak
 */
export async function saveCustomerServiceContact(
  whatsappNumber: string,
): Promise<ActionResult<{ cs_whatsapp: string | null }>> {
  // 1. Wajib admin; nomor dirapikan dan, bila diisi, harus berformat 08… 10–13 digit.
  await requireAdmin();
  const trimmedNumber = typeof whatsappNumber === "string" ? whatsappNumber.trim() : "";
  if (trimmedNumber && !/^08\d{8,11}$/.test(trimmedNumber))
    return fieldErrorResult({ wa_number: "Nomor WA harus diawali 08 dan 10–13 digit." }, "Periksa nomor WA.");
  // 2. Kirim ke backend; jawaban tanpa isi dianggap kontak dikosongkan.
  const response = await adminFetch<{ cs_whatsapp: string | null }>("/settings/cs-contact", {
    method: "PUT",
    body: JSON.stringify({ wa_number: trimmedNumber }),
  });
  return response.ok ? { data: response.data ?? { cs_whatsapp: null } } : toResult(response);
}

/**
 * Menyalakan atau mematikan mode pemeliharaan (PUT /admin/settings/maintenance). Selama aktif, penjual dan pembeli
 * mendapat jawaban 503 (layanan sedang tidak tersedia). Pesan kosong = backend memakai pesan bawaannya.
 * @param active true = mode pemeliharaan aktif (dikirim sebagai field `aktif`)
 * @param message pesan untuk pengguna, maksimal 200 karakter (dikirim sebagai field `pesan`)
 * @returns `{ data: { maintenance } }`; `{ error }` bila pesan terlalu panjang (pesan di field `pesan`) atau backend menolak
 */
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
