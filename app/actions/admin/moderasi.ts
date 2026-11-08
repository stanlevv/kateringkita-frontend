"use server";

import { galat, galatField } from "@/lib/action-result";
import { adminFetch, hasil } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { AksiModerasi, MenuModerasi, UlasanModerasi } from "@/types/admin";
import type { ActionResult } from "@/types/api";

const JENIS: Record<AksiModerasi, "reviews" | "menus"> = { hide: "reviews", unhide: "reviews", takedown: "menus", restore: "menus" };
const DENGAN_ALASAN: AksiModerasi[] = ["hide", "takedown"];

// F19 — sembunyikan/tampilkan ulasan, turunkan/pulihkan menu. Alasan 1–500 karakter wajib untuk hide & takedown.
export async function moderasi(id: number, aksi: AksiModerasi, alasan?: string): Promise<ActionResult<UlasanModerasi | MenuModerasi>> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0 || !Object.hasOwn(JENIS, aksi)) return galat("VALIDATION_ERROR", "Data moderasi tidak valid.");
  let body: string | undefined;
  if (DENGAN_ALASAN.includes(aksi)) {
    const reason = typeof alasan === "string" ? alasan.trim() : "";
    if (reason.length < 1 || reason.length > 500) return galatField({ reason: "Alasan wajib diisi, maksimal 500 karakter." }, "Periksa kembali alasan.");
    body = JSON.stringify({ reason });
  }
  return hasil(await adminFetch<UlasanModerasi | MenuModerasi>(`/${JENIS[aksi]}/${id}/${aksi}`, { method: "POST", body }));
}
