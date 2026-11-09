"use server";

import { adminFetch, hasil } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { ActionResult } from "@/types/api";
import type { HasilUjiAi, IsianAi, PenyediaAi } from "@/types/ai";

// F22 AI gateway: validasi isi di backend; aksi ini hanya meneruskan dengan sesi admin.
export async function tambahPenyediaAi(input: IsianAi): Promise<ActionResult<PenyediaAi>> {
  await requireAdmin();
  return hasil(await adminFetch<PenyediaAi>("/ai-providers", { method: "POST", body: JSON.stringify(input) }));
}

export async function ubahPenyediaAi(id: number, input: Partial<Omit<IsianAi, "provider">>): Promise<ActionResult<PenyediaAi>> {
  await requireAdmin();
  return hasil(await adminFetch<PenyediaAi>(`/ai-providers/${id}`, { method: "PATCH", body: JSON.stringify(input) }));
}

export async function hapusPenyediaAi(id: number): Promise<ActionResult<true>> {
  await requireAdmin();
  const r = await adminFetch<null>(`/ai-providers/${id}`, { method: "DELETE" });
  return r.ok ? { data: true } : { error: r.error ?? { code: "UNKNOWN", message: "Penyedia belum terhapus. Coba lagi." } };
}

export async function ujiPenyediaAi(id: number): Promise<ActionResult<HasilUjiAi>> {
  await requireAdmin();
  return hasil(await adminFetch<HasilUjiAi>(`/ai-providers/${id}/test`, { method: "POST" }));
}
