"use server";

// Server action panel admin untuk mengubah data penjual: tambah penjual, ubah profil toko dan akun pemilik,
// nonaktifkan/aktifkan akun, serta simpan/hapus menu toko. Posisi di alur: form admin → server action (file ini) →
// adminFetch → backend /admin/merchants. Isian dicek dengan aturan yang sama seperti form penjual (lib/schemas).

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import {
  adminAccountSchema,
  adminMerchantCreateSchema,
  adminStoreSchema,
  menuFormSchema,
  validateFields,
} from "@/lib/schemas";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { AdminMerchantDetail } from "@/types/admin";
import type { ActionResult } from "@/types/api";
import type { MerchantMenu } from "@/types/menu";

const isValidId = (id: number) => Number.isInteger(id) && id > 0;
// Hanya kolom yang dikenal yang dikirim ke backend; nilai bukan teks dianggap kosong.
const pick = (input: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, typeof input[key] === "string" ? (input[key] as string).trim() : ""]));
const invalidMerchant = () => errorResult("NOT_FOUND", "Penjual tidak ditemukan.");

/**
 * Menambah penjual baru (akun pemilik + toko) lewat POST /admin/merchants.
 * @param input isian form: nama, nomor WA, email (boleh kosong), sandi awal, nama usaha, jenis usaha, alamat
 * @returns `{ data }` detail penjual baru; `{ error }` bila isian salah atau nomor/email sudah terdaftar
 */
export async function createMerchant(input: Record<string, string>): Promise<ActionResult<AdminMerchantDetail>> {
  await requireAdmin();
  const values = pick(input, ["full_name", "phone", "email", "business_name", "merchant_type_id", "address"]);
  values.password = typeof input.password === "string" ? input.password : "";
  const errors = validateFields(adminMerchantCreateSchema, values);
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali data penjual.");
  const { email, merchant_type_id: merchantTypeId, ...rest } = values;
  const body = { ...rest, merchant_type_id: Number(merchantTypeId), ...(email && { email }) };
  return toResult(await adminFetch<AdminMerchantDetail>("/merchants", { method: "POST", body: JSON.stringify(body) }));
}

/**
 * Mengubah profil toko lewat PATCH /admin/merchants/:id.
 * @param id    id toko
 * @param input nama usaha, alamat, WA toko, deskripsi
 * @returns `{ data }` detail penjual sesudah diubah; `{ error }` bila isian salah atau backend menolak
 */
export async function updateMerchantStore(
  id: number,
  input: Record<string, string>,
): Promise<ActionResult<AdminMerchantDetail>> {
  await requireAdmin();
  if (!isValidId(id)) return invalidMerchant();
  const values = pick(input, ["business_name", "address", "wa_number", "description"]);
  const errors = validateFields(adminStoreSchema, values);
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali data toko.");
  return toResult(
    await adminFetch<AdminMerchantDetail>(`/merchants/${id}`, { method: "PATCH", body: JSON.stringify(values) }),
  );
}

/**
 * Mengubah akun pemilik toko (nama, nomor WA login, email) lewat PATCH /admin/merchants/:id/owner.
 * @param id    id toko
 * @param input nama, nomor WA, email (kosong = dikosongkan)
 * @returns `{ data }` detail penjual sesudah diubah; `{ error }` bila isian salah atau nomor/email dipakai akun lain
 */
export async function updateMerchantOwner(
  id: number,
  input: Record<string, string>,
): Promise<ActionResult<AdminMerchantDetail>> {
  await requireAdmin();
  if (!isValidId(id)) return invalidMerchant();
  const values = pick(input, ["full_name", "phone", "email"]);
  const errors = validateFields(adminAccountSchema, values);
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali data pemilik.");
  return toResult(
    await adminFetch<AdminMerchantDetail>(`/merchants/${id}/owner`, { method: "PATCH", body: JSON.stringify(values) }),
  );
}

/**
 * Menonaktifkan atau mengaktifkan lagi akun pemilik toko.
 * @param id     id toko
 * @param active `true` aktifkan, `false` nonaktifkan
 * @returns `{ data }` detail penjual sesudah diubah; `{ error }` bila backend menolak
 */
export async function setMerchantAccountActive(
  id: number,
  active: boolean,
): Promise<ActionResult<AdminMerchantDetail>> {
  await requireAdmin();
  if (!isValidId(id)) return invalidMerchant();
  return toResult(
    await adminFetch<AdminMerchantDetail>(`/merchants/${id}/account/${active ? "activate" : "deactivate"}`, {
      method: "POST",
    }),
  );
}

/**
 * Menambah (menuId null) atau mengubah menu toko. Dipakai MenuForm lewat `.bind(null, merchantId)` di halaman admin,
 * jadi bentuknya sama dengan saveMenu milik penjual.
 * @param merchantId id toko
 * @param menuId     id menu, atau null untuk menu baru
 * @param input      isian form menu
 * @returns `{ data }` menu tersimpan; `{ error }` bila isian salah (pesan per field) atau backend menolak
 */
export async function saveMerchantMenu(
  merchantId: number,
  menuId: number | null,
  input: unknown,
): Promise<ActionResult<MerchantMenu>> {
  await requireAdmin();
  if (!isValidId(merchantId) || (menuId !== null && !isValidId(menuId))) return invalidMerchant();
  const parsed = menuFormSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) (fields[issue.path.join(".")] ??= []).push(issue.message);
    return { error: { code: "VALIDATION_ERROR", message: "Periksa kembali isian menu.", fields } };
  }
  const path = menuId === null ? `/merchants/${merchantId}/menus` : `/merchants/${merchantId}/menus/${menuId}`;
  return toResult(
    await adminFetch<MerchantMenu>(path, {
      method: menuId === null ? "POST" : "PATCH",
      body: JSON.stringify(parsed.data),
    }),
  );
}

/**
 * Menghapus menu toko (hapus lunak) lewat DELETE /admin/merchants/:id/menus/:menuId.
 * @param merchantId id toko
 * @param menuId     id menu
 * @returns `{ data: null }` bila terhapus; `{ error }` bila backend menolak
 */
export async function deleteMerchantMenu(merchantId: number, menuId: number): Promise<ActionResult<null>> {
  await requireAdmin();
  if (!isValidId(merchantId) || !isValidId(menuId)) return invalidMerchant();
  const response = await adminFetch<null>(`/merchants/${merchantId}/menus/${menuId}`, { method: "DELETE" });
  return response.ok ? { data: null } : toResult(response);
}
