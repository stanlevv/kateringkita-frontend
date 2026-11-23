import "server-only";
import { adminFetch, toResult } from "@/services/api";
import type { DataResult } from "@/types/api";
import type { FinanceSummary } from "@/types/admin";

// F20: GET /admin/finance?from&to (YYYY-MM-DD WIB); dipakai halaman /admin/keuangan dan unduhan CSV
export async function getFinanceSummary({
  from,
  to,
}: {
  from: string;
  to: string;
}): Promise<DataResult<FinanceSummary>> {
  return toResult(await adminFetch<FinanceSummary>(`/finance?${new URLSearchParams({ from, to })}`));
}
