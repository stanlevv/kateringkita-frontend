import "server-only";

// Data rekap keuangan admin (GET /admin/finance), dipakai halaman /admin/keuangan dan unduhan CSV.
// Posisi di alur: halaman (baca data) atau server action (ubah data) -> services (file ini) -> api.ts -> backend.

import { adminFetch, toResult } from "@/services/api";
import type { DataResult } from "@/types/api";
import type { FinanceSummary } from "@/types/admin";

/**
 * Mengambil rekap keuangan per toko dalam rentang tanggal.
 * @param range `from` dan `to` dalam format YYYY-MM-DD (WIB)
 * @returns `{ data }` atau `{ error }`
 */
export async function getFinanceSummary({
  from,
  to,
}: {
  from: string;
  to: string;
}): Promise<DataResult<FinanceSummary>> {
  return toResult(await adminFetch<FinanceSummary>(`/finance?${new URLSearchParams({ from, to })}`));
}
