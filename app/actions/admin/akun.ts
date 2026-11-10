"use server";

import { galat, galatField } from "@/lib/action-result";
import type { AdminLevel } from "@/lib/admin-level";
import { adminFetch, hasil } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { AdminDenganSandi, AkunAdmin } from "@/types/admin";
import type { ActionResult } from "@/types/api";

const LEVEL: AdminLevel[] = ["super", "ops", "support"];
const idOk = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const tidakValid = () => galat("VALIDATION_ERROR", "Data tidak valid.");

// Fase 1 — khusus admin super. Sandi sementara hanya ada di respons ini; tampilkan sekali lalu buang.
export async function buatAdmin(input: { full_name: string; phone: string; admin_level: AdminLevel }): Promise<ActionResult<AdminDenganSandi>> {
  await requireAdmin("super");
  const full_name = String(input?.full_name ?? "").trim();
  const phone = String(input?.phone ?? "").trim();
  const masalah: Record<string, string> = {};
  if (full_name.length < 1 || full_name.length > 150) masalah.full_name = "Nama 1–150 karakter.";
  if (!/^08\d{8,11}$/.test(phone)) masalah.phone = "Nomor HP harus diawali 08 dan 10–13 digit.";
  if (!LEVEL.includes(input?.admin_level)) masalah.admin_level = "Pilih tingkat admin.";
  if (Object.keys(masalah).length) return galatField(masalah, "Periksa kembali isian.");
  return hasil(await adminFetch<AdminDenganSandi>("/admins", { method: "POST", body: JSON.stringify({ full_name, phone, admin_level: input.admin_level }) }));
}

export async function ubahLevelAdmin(id: number, level: AdminLevel): Promise<ActionResult<AkunAdmin>> {
  await requireAdmin("super");
  if (!idOk(id) || !LEVEL.includes(level)) return tidakValid();
  return hasil(await adminFetch<AkunAdmin>(`/admins/${id}/level`, { method: "PATCH", body: JSON.stringify({ admin_level: level }) }));
}

export async function setAktifAdmin(id: number, aktif: boolean): Promise<ActionResult<AkunAdmin>> {
  await requireAdmin("super");
  if (!idOk(id) || typeof aktif !== "boolean") return tidakValid();
  return hasil(await adminFetch<AkunAdmin>(`/admins/${id}/${aktif ? "activate" : "deactivate"}`, { method: "POST" }));
}

export async function resetSandiAdmin(id: number): Promise<ActionResult<AdminDenganSandi>> {
  await requireAdmin("super");
  if (!idOk(id)) return tidakValid();
  return hasil(await adminFetch<AdminDenganSandi>(`/admins/${id}/reset-password`, { method: "POST" }));
}
