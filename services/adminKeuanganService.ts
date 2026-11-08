import "server-only";
import { adminFetch, hasil } from "@/services/api";
import type { DataResult } from "@/types/api";
import type { RekapKeuangan } from "@/types/admin";

// F20: GET /admin/finance?from&to (YYYY-MM-DD WIB); dipakai halaman /admin/keuangan dan unduhan CSV
export async function getRekapKeuangan({ from, to }: { from: string; to: string }): Promise<DataResult<RekapKeuangan>> {
  return hasil(await adminFetch<RekapKeuangan>(`/finance?${new URLSearchParams({ from, to })}`));
}
