"use server";

import { apiFetch, hasil } from "@/services/api";
import { getSessionToken, requireMerchant } from "@/services/authService";
import type { ActionResult } from "@/types/api";

// Halaman Notifikasi dibuka → semua ditandai dibaca (POST /me/notifications/read { all: true })
export async function tandaiSemuaDibaca(): Promise<ActionResult<{ unread_count: number }>> {
  await requireMerchant();
  return hasil(
    await apiFetch<{ unread_count: number }>("/me/notifications/read", {
      method: "POST",
      token: await getSessionToken(),
      body: JSON.stringify({ all: true }),
    }),
  );
}
