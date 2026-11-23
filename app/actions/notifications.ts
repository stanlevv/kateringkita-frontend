"use server";

// Server action notifikasi penjual: menandai semua notifikasi sudah dibaca saat halaman Notifikasi dibuka.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur: halaman/form -> server action (file ini) -> services/api.ts -> backend.

import { apiFetch, toResult } from "@/services/api";
import { getSessionToken, requireMerchant } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

/**
 * Menandai semua notifikasi akun ini sudah dibaca (POST /me/notifications/read dengan `{ all: true }`).
 * @returns `{ data: { unread_count } }` (jumlah belum dibaca, biasanya 0), atau `{ error }` dari backend
 */
export async function markAllNotificationsRead(): Promise<ActionResult<{ unread_count: number }>> {
  await requireMerchant();
  return toResult(
    await apiFetch<{ unread_count: number }>("/me/notifications/read", {
      method: "POST",
      token: await getSessionToken(),
      body: JSON.stringify({ all: true }),
    }),
  );
}
