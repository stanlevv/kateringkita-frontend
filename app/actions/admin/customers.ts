"use server";

// Server action panel admin untuk data pembeli: tambah, ubah, serta nonaktifkan/aktifkan akun. Posisi di alur:
// form admin → server action (file ini) → adminFetch → backend /admin/customers.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminAccountSchema, adminCustomerCreateSchema, validateFields } from "@/lib/schemas";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { CustomerDetail } from "@/types/admin";
import type { ActionResult } from "@/types/api";

const isValidId = (id: number) => Number.isInteger(id) && id > 0;
// Hanya kolom yang dikenal yang dikirim ke backend; nilai bukan teks dianggap kosong.
const pick = (input: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, typeof input[key] === "string" ? (input[key] as string).trim() : ""]));
const invalidCustomer = () => errorResult("NOT_FOUND", "Pembeli tidak ditemukan.");

/**
 * Menambah akun pembeli lewat POST /admin/customers.
 * @param input nama, nomor WA, email, dan sandi awal
 * @returns `{ data }` detail pembeli baru; `{ error }` bila isian salah atau nomor/email sudah terdaftar
 */
export async function createCustomer(input: Record<string, string>): Promise<ActionResult<CustomerDetail>> {
  await requireAdmin();
  const values = pick(input, ["full_name", "phone", "email"]);
  values.password = typeof input.password === "string" ? input.password : "";
  const errors = validateFields(adminCustomerCreateSchema, values);
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali data pembeli.");
  return toResult(await adminFetch<CustomerDetail>("/customers", { method: "POST", body: JSON.stringify(values) }));
}

/**
 * Mengubah nama, nomor WA, dan email pembeli lewat PATCH /admin/customers/:id.
 * @param id    id pembeli
 * @param input nama, nomor WA, email
 * @returns `{ data }` detail pembeli sesudah diubah; `{ error }` bila isian salah atau nomor/email dipakai akun lain
 */
export async function updateCustomer(id: number, input: Record<string, string>): Promise<ActionResult<CustomerDetail>> {
  await requireAdmin();
  if (!isValidId(id)) return invalidCustomer();
  const values = pick(input, ["full_name", "phone", "email"]);
  const errors = validateFields(adminAccountSchema, values);
  if (!values.email) errors.email = "Email wajib diisi.";
  if (Object.keys(errors).length > 0) return fieldErrorResult(errors, "Periksa kembali data pembeli.");
  return toResult(
    await adminFetch<CustomerDetail>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(values) }),
  );
}

/**
 * Menonaktifkan atau mengaktifkan lagi akun pembeli.
 * @param id     id pembeli
 * @param active `true` aktifkan, `false` nonaktifkan
 * @returns `{ data }` detail pembeli sesudah diubah; `{ error }` bila backend menolak
 */
export async function setCustomerActive(id: number, active: boolean): Promise<ActionResult<CustomerDetail>> {
  await requireAdmin();
  if (!isValidId(id)) return invalidCustomer();
  return toResult(
    await adminFetch<CustomerDetail>(`/customers/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" }),
  );
}
