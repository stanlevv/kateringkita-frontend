import "server-only";

// Hitungan antrean yang menunggu admin (GET /admin/queues) untuk lencana menu dan ubin "Perlu tindakan" di /admin.
// Posisi di alur: layout/halaman admin -> services (file ini) -> api.ts -> backend.

import { cache } from "react";
import { adminFetch } from "@/services/api";
import type { AdminQueues } from "@/types/admin";

/**
 * Mengambil hitungan antrean admin. Dibungkus `cache()` agar layout dan halaman /admin berbagi satu panggilan per render.
 * @returns hitungan antrean, atau null bila gagal dimuat (lencana dan ubin cukup disembunyikan)
 */
export const getAdminQueues = cache(async (): Promise<AdminQueues | null> => {
  const response = await adminFetch<AdminQueues>("/queues");
  return response.ok && response.data ? response.data : null;
});
