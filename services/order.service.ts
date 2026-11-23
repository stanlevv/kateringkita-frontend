import "server-only";
import { cache } from "react";
import { toResult, merchantFetch } from "@/services/api";
import { todayWib } from "@/lib/format";
import { newOrder } from "@/lib/fixtures/orders";
import { LIMIT_ORDERS } from "@/lib/order-filter";
import { getScenario } from "@/lib/scenario";
import type { ApiError, DataResult } from "@/types/api";
import type { MerchantOrder, OrderStatus } from "@/types/order";

// Skenario /pratinjau (hanya dev) ditumpuk di atas data sungguhan (F04 D18).
const LOAD_FAILED: { error: ApiError } = {
  error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." },
};
const totalFromMeta = (meta: unknown) => (meta as { total?: number } | undefined)?.total ?? 0;

export type OrderListFilter = { status?: OrderStatus; date?: string; q?: string; page?: number };

/** Satu halaman daftar pesanan (M-04); filter dan halaman diproses server (D16). */
export async function getOrders(
  filter: OrderListFilter = {},
): Promise<DataResult<{ rows: MerchantOrder[]; total: number }>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return LOAD_FAILED;
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: { rows: [], total: 0 } };
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.date) params.set("date", filter.date);
  if (filter.q) params.set("q", filter.q);
  if (filter.page) params.set("page", String(filter.page));
  params.set("limit", String(LIMIT_ORDERS));
  const response = await merchantFetch<MerchantOrder[]>(`/orders?${params}`);
  return response.ok && response.data
    ? { data: { rows: response.data, total: totalFromMeta(response.meta) } }
    : (toResult(response) as { error: ApiError });
}

/** Antrean dashboard: semua yang masih aktif + semua pesanan hari ini, kode sama sekali (D16). */
// shortcut: maks 100 per panggilan; tambah pagination antrean bila toko > 100 pesanan aktif/hari
export const getQueue = cache(async (): Promise<DataResult<MerchantOrder[]>> => {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return LOAD_FAILED;
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: [] };
  const [activeResult, todayResult] = await Promise.all([
    merchantFetch<MerchantOrder[]>("/orders?status=holding,confirmed,cooking,ready&limit=100"),
    merchantFetch<MerchantOrder[]>(`/orders?date=${todayWib()}&limit=100`),
  ]);
  for (const result of [activeResult, todayResult])
    if (!result.ok || !result.data) return toResult(result) as { error: ApiError };
  const byCode = new Map(
    [...(activeResult.data ?? []), ...(todayResult.data ?? [])].map((order) => [order.code, order]),
  );
  return { data: [...(scenario === "pesanan-baru" ? [newOrder()] : []), ...byCode.values()] };
});

/**
 * M-04, D3/D4: pesanan yang berubah sejak `sejak`. Maju memakai `updated_at` terbesar (API §1), bukan `page`,
 * maks 5 putaran agar tidak berputar; kode sama di dua putaran -> versi terakhir.
 */
export async function getChangedOrders(since: string): Promise<DataResult<MerchantOrder[]>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat" || scenario === "gagal-sinkron") return LOAD_FAILED;
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: [] };
  const byCode = new Map<string, MerchantOrder>();
  let cursor = since;
  for (let round = 0; round < 5; round++) {
    const response = await merchantFetch<MerchantOrder[]>(
      `/orders?${new URLSearchParams({ updated_since: cursor, limit: "100" })}`,
    );
    if (!response.ok || !response.data) return toResult(response) as { error: ApiError };
    for (const order of response.data) byCode.set(order.code, order);
    const latest = response.data.reduce(
      (latestSoFar, order) => (Date.parse(order.updated_at) > Date.parse(latestSoFar) ? order.updated_at : latestSoFar),
      cursor,
    );
    if (response.data.length < 100 || Date.parse(latest) <= Date.parse(cursor)) break;
    cursor = latest;
  }
  return { data: [...byCode.values()] };
}

/** Badge sidebar: pesanan menunggu + terkonfirmasi; galat dianggap 0. */
export async function getNeedsActionCount(): Promise<number> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat" || scenario === "kosong" || scenario === "penjual-baru") return 0;
  const response = await merchantFetch<MerchantOrder[]>("/orders?status=holding,confirmed&limit=1");
  return (response.ok ? totalFromMeta(response.meta) : 0) + (scenario === "pesanan-baru" ? 1 : 0);
}

export async function getOrder(code: string): Promise<DataResult<MerchantOrder>> {
  return toResult(await merchantFetch<MerchantOrder>(`/orders/${encodeURIComponent(code)}`));
}
