"use server";

import { galat, galatField } from "@/lib/action-result";
import { adminFetch, hasil } from "@/services/api";
import { cekBiaya } from "@/services/adminMasterService";
import { bersihkanPromo, cekPromo } from "@/lib/schemas";
import { requireAdmin } from "@/services/authService";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";

const idOk = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const argSalah = () => galat("VALIDATION_ERROR", "Data promo tidak valid.");

// A-02/A-03 — promo platform. Validasi sama dengan form penjual (cekPromo); backend tetap sumber kebenaran.
// Kode tidak bisa diubah; promo baru langsung aktif (bawaan backend), status diubah lewat setAktifPromoPlatform.
export async function simpanPromoPlatform(id: number | null, input: unknown): Promise<ActionResult<Promo>> {
  await requireAdmin();
  if (id !== null && !idOk(id)) return argSalah();
  const masalah = cekPromo(input);
  if (Object.keys(masalah).length > 0) return galatField(masalah, "Periksa kembali isian promo.");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- status hanya lewat Aktifkan/Nonaktifkan di daftar
  const { code, is_active, ...d } = bersihkanPromo(input);
  const body = JSON.stringify(id === null ? { code, ...d } : d);
  return hasil(await adminFetch<Promo>(id === null ? "/promos" : `/promos/${id}`, { method: id === null ? "POST" : "PATCH", body }));
}

export async function setAktifPromoPlatform(id: number, aktif: boolean): Promise<ActionResult<Promo>> {
  await requireAdmin();
  if (!idOk(id) || typeof aktif !== "boolean") return argSalah();
  return hasil(await adminFetch<Promo>(`/promos/${id}/${aktif ? "activate" : "deactivate"}`, { method: "POST" }));
}

// A-04 — biaya layanan: bilangan bulat 0–100.000.
export async function simpanBiayaLayanan(value: number): Promise<ActionResult<{ service_fee: number }>> {
  await requireAdmin();
  const masalah = cekBiaya(value);
  if (masalah) return galatField({ value: masalah }, masalah);
  return hasil(await adminFetch<{ service_fee: number }>("/settings/service-fee", { method: "PUT", body: JSON.stringify({ value }) }));
}

// Kontak CS untuk aplikasi pembeli: nomor WA 08… (10–13 digit) atau kosong.
export async function simpanKontakCs(wa: string): Promise<ActionResult<{ cs_whatsapp: string | null }>> {
  await requireAdmin();
  const nomor = typeof wa === "string" ? wa.trim() : "";
  if (nomor && !/^08\d{8,11}$/.test(nomor)) return galatField({ wa_number: "Nomor WA harus diawali 08 dan 10–13 digit." }, "Periksa nomor WA.");
  const res = await adminFetch<{ cs_whatsapp: string | null }>("/settings/cs-contact", { method: "PUT", body: JSON.stringify({ wa_number: nomor }) });
  return res.ok ? { data: res.data ?? { cs_whatsapp: null } } : hasil(res);
}
