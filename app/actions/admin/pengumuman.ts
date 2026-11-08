"use server";

import { galat, galatField } from "@/lib/action-result";
import { adminFetch, hasil } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { ActionResult } from "@/types/api";

export type Penerima = "all" | "customer" | "merchant";
const PENERIMA: Penerima[] = ["all", "customer", "merchant"];

// Broadcast pengumuman → notifikasi tab Info di aplikasi. Batas sama dengan backend (judul 120, isi 255).
export async function kirimPengumuman(input: { audience: Penerima; title: string; body: string }): Promise<ActionResult<{ sent: number }>> {
  await requireAdmin();
  if (!PENERIMA.includes(input?.audience)) return galat("VALIDATION_ERROR", "Pilih penerima pengumuman.");
  const title = String(input.title ?? "").trim();
  const body = String(input.body ?? "").trim();
  const masalah: Record<string, string> = {};
  if (title.length < 1 || title.length > 120) masalah.title = "Judul 1–120 karakter.";
  if (body.length < 1 || body.length > 255) masalah.body = "Isi 1–255 karakter.";
  if (Object.keys(masalah).length) return galatField(masalah, "Periksa kembali pengumuman.");
  return hasil(await adminFetch<{ sent: number }>("/broadcasts", { method: "POST", body: JSON.stringify({ audience: input.audience, title, body }) }));
}
