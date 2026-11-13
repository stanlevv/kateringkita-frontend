"use server";

import { galat, galatField } from "@/lib/action-result";
import { BATAS_BALASAN, kodeTiketValid } from "@/services/adminTiketService";
import { adminFetch, hasil } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { ActionResult } from "@/types/api";

// Tiket bantuan: semua tingkat admin (super, ops, support) boleh membalas dan menutup. Backend tetap penjaga utamanya.
const jalur = (code: string, aksi: "messages" | "close") => `/tickets/${encodeURIComponent(code)}/${aksi}`;

/** Balasan 1–2000 karakter setelah dipangkas. Tiket yang sudah ditutup ditolak backend (409 TICKET_CLOSED). */
export async function balasTiket(code: string, body: string): Promise<ActionResult<null>> {
  await requireAdmin();
  if (!kodeTiketValid(code)) return galat("VALIDATION_ERROR", "Tiket tidak valid.");
  const isi = typeof body === "string" ? body.trim() : "";
  if (isi.length < 1 || isi.length > BATAS_BALASAN) return galatField({ body: `Pesan 1–${BATAS_BALASAN} karakter.` }, "Periksa kembali balasan.");
  const res = await adminFetch<null>(jalur(code, "messages"), { method: "POST", body: JSON.stringify({ body: isi }) });
  return res.ok ? { data: null } : hasil(res);
}

/** Tiket yang sudah ditutup tetap 200 dari backend (tanpa perubahan). */
export async function tutupTiket(code: string): Promise<ActionResult<null>> {
  await requireAdmin();
  if (!kodeTiketValid(code)) return galat("VALIDATION_ERROR", "Tiket tidak valid.");
  const res = await adminFetch<null>(jalur(code, "close"), { method: "POST" });
  return res.ok ? { data: null } : hasil(res);
}
