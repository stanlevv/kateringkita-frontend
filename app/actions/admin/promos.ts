"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { adminFetch, toResult } from "@/services/api";
import { validateServiceFee } from "@/services/admin-master.service";
import { parsePromo, validatePromo } from "@/lib/schemas";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Promo } from "@/types/promo";
import type { Maintenance } from "@/types/meta";

const idOk = (id: unknown) => Number.isInteger(id) && (id as number) > 0;
const argSalah = () => errorResult("VALIDATION_ERROR", "Data promo tidak valid.");

// A-02/A-03 — promo platform. Validasi sama dengan form penjual (cekPromo); backend tetap sumber kebenaran.
// Kode tidak bisa diubah; promo baru langsung aktif (bawaan backend), status diubah lewat setAktifPromoPlatform.
export async function simpanPromoPlatform(id: number | null, input: unknown): Promise<ActionResult<Promo>> {
  await requireAdmin();
  if (id !== null && !idOk(id)) return argSalah();
  const masalah = validatePromo(input);
  if (Object.keys(masalah).length > 0) return fieldErrorResult(masalah, "Periksa kembali isian promo.");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- status hanya lewat Aktifkan/Nonaktifkan di daftar
  const { code, is_active, ...d } = parsePromo(input);
  const body = JSON.stringify(id === null ? { code, ...d } : d);
  return toResult(
    await adminFetch<Promo>(id === null ? "/promos" : `/promos/${id}`, {
      method: id === null ? "POST" : "PATCH",
      body,
    }),
  );
}

export async function setAktifPromoPlatform(id: number, aktif: boolean): Promise<ActionResult<Promo>> {
  await requireAdmin();
  if (!idOk(id) || typeof aktif !== "boolean") return argSalah();
  return toResult(await adminFetch<Promo>(`/promos/${id}/${aktif ? "activate" : "deactivate"}`, { method: "POST" }));
}

// A-04 — biaya layanan: bilangan bulat 0–100.000.
export async function simpanBiayaLayanan(value: number): Promise<ActionResult<{ service_fee: number }>> {
  await requireAdmin();
  const masalah = validateServiceFee(value);
  if (masalah) return fieldErrorResult({ value: masalah }, masalah);
  return toResult(
    await adminFetch<{ service_fee: number }>("/settings/service-fee", {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
  );
}

// Kontak CS untuk aplikasi pembeli: nomor WA 08… (10–13 digit) atau kosong.
export async function simpanKontakCs(wa: string): Promise<ActionResult<{ cs_whatsapp: string | null }>> {
  await requireAdmin();
  const nomor = typeof wa === "string" ? wa.trim() : "";
  if (nomor && !/^08\d{8,11}$/.test(nomor))
    return fieldErrorResult({ wa_number: "Nomor WA harus diawali 08 dan 10–13 digit." }, "Periksa nomor WA.");
  const res = await adminFetch<{ cs_whatsapp: string | null }>("/settings/cs-contact", {
    method: "PUT",
    body: JSON.stringify({ wa_number: nomor }),
  });
  return res.ok ? { data: res.data ?? { cs_whatsapp: null } } : toResult(res);
}

// F27 mode pemeliharaan: penjual & pembeli dapat 503 selama aktif; pesan kosong = pesan bawaan backend.
export async function simpanPemeliharaan(
  aktif: boolean,
  pesan: string,
): Promise<ActionResult<{ maintenance: Maintenance }>> {
  await requireAdmin();
  const teks = typeof pesan === "string" ? pesan.trim() : "";
  if (teks.length > 200) return fieldErrorResult({ pesan: "Pesan maksimal 200 karakter." }, "Periksa pesan.");
  return toResult(
    await adminFetch<{ maintenance: Maintenance }>("/settings/maintenance", {
      method: "PUT",
      body: JSON.stringify({ aktif: aktif === true, pesan: teks }),
    }),
  );
}
