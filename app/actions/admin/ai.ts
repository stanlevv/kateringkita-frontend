"use server";

import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { AiTestResult, AiProviderInput, AiProvider } from "@/types/ai";

// F22 AI gateway: validasi isi di backend; aksi ini hanya meneruskan dengan sesi admin.
export async function tambahPenyediaAi(input: AiProviderInput): Promise<ActionResult<AiProvider>> {
  await requireAdmin();
  return toResult(await adminFetch<AiProvider>("/ai-providers", { method: "POST", body: JSON.stringify(input) }));
}

export async function ubahPenyediaAi(
  id: number,
  input: Partial<Omit<AiProviderInput, "provider">>,
): Promise<ActionResult<AiProvider>> {
  await requireAdmin();
  return toResult(
    await adminFetch<AiProvider>(`/ai-providers/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  );
}

export async function hapusPenyediaAi(id: number): Promise<ActionResult<true>> {
  await requireAdmin();
  const r = await adminFetch<null>(`/ai-providers/${id}`, { method: "DELETE" });
  return r.ok
    ? { data: true }
    : { error: r.error ?? { code: "UNKNOWN", message: "Penyedia belum terhapus. Coba lagi." } };
}

export async function ujiPenyediaAi(id: number): Promise<ActionResult<AiTestResult>> {
  await requireAdmin();
  return toResult(await adminFetch<AiTestResult>(`/ai-providers/${id}/test`, { method: "POST" }));
}
