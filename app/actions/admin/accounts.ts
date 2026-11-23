"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import type { AdminLevel } from "@/lib/admin-level";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { AdminWithPassword, AdminAccount } from "@/types/admin";
import type { ActionResult } from "@/types/api";

const ADMIN_LEVELS: AdminLevel[] = ["super", "ops", "support"];
const isValidId = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const invalidDataError = () => errorResult("VALIDATION_ERROR", "Data tidak valid.");

// Fase 1 — khusus admin super. Sandi sementara hanya ada di respons ini; tampilkan sekali lalu buang.
export async function createAdmin(input: {
  full_name: string;
  phone: string;
  admin_level: AdminLevel;
}): Promise<ActionResult<AdminWithPassword>> {
  await requireAdmin("super");
  const fullName = String(input?.full_name ?? "").trim();
  const phone = String(input?.phone ?? "").trim();
  const errors: Record<string, string> = {};
  if (fullName.length < 1 || fullName.length > 150) errors.full_name = "Nama 1–150 karakter.";
  if (!/^08\d{8,11}$/.test(phone)) errors.phone = "Nomor HP harus diawali 08 dan 10–13 digit.";
  if (!ADMIN_LEVELS.includes(input?.admin_level)) errors.admin_level = "Pilih tingkat admin.";
  if (Object.keys(errors).length) return fieldErrorResult(errors, "Periksa kembali isian.");
  return toResult(
    await adminFetch<AdminWithPassword>("/admins", {
      method: "POST",
      body: JSON.stringify({ full_name: fullName, phone, admin_level: input.admin_level }),
    }),
  );
}

export async function updateAdminLevel(id: number, level: AdminLevel): Promise<ActionResult<AdminAccount>> {
  await requireAdmin("super");
  if (!isValidId(id) || !ADMIN_LEVELS.includes(level)) return invalidDataError();
  return toResult(
    await adminFetch<AdminAccount>(`/admins/${id}/level`, {
      method: "PATCH",
      body: JSON.stringify({ admin_level: level }),
    }),
  );
}

export async function setAdminActive(id: number, active: boolean): Promise<ActionResult<AdminAccount>> {
  await requireAdmin("super");
  if (!isValidId(id) || typeof active !== "boolean") return invalidDataError();
  return toResult(
    await adminFetch<AdminAccount>(`/admins/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" }),
  );
}

export async function resetAdminPassword(id: number): Promise<ActionResult<AdminWithPassword>> {
  await requireAdmin("super");
  if (!isValidId(id)) return invalidDataError();
  return toResult(await adminFetch<AdminWithPassword>(`/admins/${id}/reset-password`, { method: "POST" }));
}
